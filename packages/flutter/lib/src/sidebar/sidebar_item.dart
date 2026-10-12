import 'package:flutter/widgets.dart';

/// One destination of a [Sidebar].
@immutable
class SidebarItem<T> {
  /// Creates a destination named [label].
  const SidebarItem({
    required this.value,
    required this.label,
    this.icon,
    this.uri,
  });

  /// Identifies the destination; the sidebar's `value` names the current one.
  final T value;

  /// The visible label and accessible name.
  final String label;

  /// The leading icon. The rail is offered only when every destination has
  /// one: once the labels are out of sight, the icon is all it shows.
  final Widget? icon;

  /// The destination's address. Given, the item is announced as a link with
  /// this address and Enter presses it; without it, the item is a button
  /// that Enter and Space press.
  final Uri? uri;
}

/// A group of [SidebarItem]s.
///
/// A plain section has an optional heading. A collapsible section's heading
/// is a disclosure button; its [id] is the name it answers to in
/// `Sidebar.expandedSections`, since two sections may share a label.
@immutable
class SidebarSection<T> {
  /// A section with an optional heading [label].
  const SidebarSection({this.label, required this.items})
    : id = null,
      collapsible = false,
      initiallyExpanded = false;

  /// A section whose heading [label] shows and hides its [items].
  const SidebarSection.collapsible({
    required String this.id,
    required String this.label,
    required this.items,
    this.initiallyExpanded = false,
  }) : collapsible = true;

  /// The name a collapsible section answers to; unique within the sidebar.
  /// Null for a plain section.
  final String? id;

  /// The heading.
  final String? label;

  /// The destinations, in order.
  final List<SidebarItem<T>> items;

  /// Whether the heading shows and hides the items.
  final bool collapsible;

  /// Whether a collapsible section starts expanded when the sidebar keeps the
  /// set itself. The section holding the current destination starts
  /// expanded anyway.
  final bool initiallyExpanded;
}

/// The name each section answers to, in order, as the web adapters'
/// `resolveSections` gives it, with the consumer mistakes found on the way.
///
/// A collapsible section needs an id and no two may share one, or they would
/// open together; the sidebar fails an assertion on either mistake in debug
/// builds. The fallback is deterministic and never shared: a section with no
/// id answers to its position, and a name already taken stays with the first
/// section that claimed it, the later ones taking `id#2`, `id#3`. Plain
/// sections claim their position too, since the list is keyed by it.
({List<String> ids, List<String> mistakes}) resolveSectionIds<T>(
  List<SidebarSection<T>> sections,
) {
  final taken = <String>{};
  final ids = <String>[];
  final mistakes = <String>[];

  void claim(String candidate) {
    var id = candidate;
    for (var n = 2; taken.contains(id); n++) {
      id = '$candidate#$n';
    }
    taken.add(id);
    ids.add(id);
  }

  for (final (index, section) in sections.indexed) {
    final id = section.id ?? '';
    if (!section.collapsible) {
      claim('$index');
    } else if (id.isEmpty) {
      mistakes.add(
        'A collapsible sidebar section needs an id ("${section.label}" has '
        'none): it is the name the section answers to in expandedSections.',
      );
      claim('$index');
    } else {
      if (taken.contains(id)) {
        mistakes.add(
          'Two collapsible sidebar sections share the id "$id": sharing a '
          'name means sharing an expanded state.',
        );
      }
      claim(id);
    }
  }
  return (ids: ids, mistakes: mistakes);
}

/// Whether the rail can be offered: every destination must show an icon.
bool canRail<T>(List<SidebarSection<T>> sections) => sections.every(
  (section) => section.items.every((item) => item.icon != null),
);
