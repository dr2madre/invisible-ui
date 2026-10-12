import 'package:flutter/foundation.dart';

// The English `avatarGroup.more`: its one and other forms read the same.
String _avatarGroupMore(int count) => '$count more';

// The English `rating.stars`.
String _ratingStars(int count) => count == 1 ? '$count star' : '$count stars';

// The English `table.results`.
String _tableResults(int count) =>
    count == 1 ? '$count result' : '$count results';

/// The text the components show or announce.
///
/// The defaults are the English catalog of `core/src/i18n/messages.ts`; each
/// field names its catalog key. Pass translated text through
/// [InvisibleThemeData.messages]. Only the keys a shipped widget uses are
/// here. A message with a `{name}` placeholder keeps it in the translation;
/// the widget fills it in.
@immutable
class InvisibleMessages {
  /// Creates a message set, English unless a field is given.
  const InvisibleMessages({
    this.loadingLabel = 'Loading…',
    this.buttonCopied = 'Copied',
    this.submenuHint = 'submenu',
    this.contextMenuLabel = 'Context menu',
    this.closeLabel = 'Close',
    this.notificationRegionLabel = 'Notifications',
    this.numberFieldIncrement = 'Increase {label}',
    this.numberFieldDecrement = 'Decrease {label}',
    this.numberFieldParseError = 'Enter a number.',
    this.numberFieldRangeUnderflow = 'Enter a number that is at least {min}.',
    this.numberFieldRangeOverflow = 'Enter a number that is at most {max}.',
    this.numberFieldStepMismatch = 'Enter a multiple of {step}.',
    this.dialogCloseLabel = 'Close',
    this.dialogConfirmLabel = 'Confirm',
    this.dialogCancelLabel = 'Cancel',
    this.dialogDismissLabel = 'OK',
    this.switchOn = 'ON',
    this.switchOff = 'OFF',
    this.selectPlaceholder = 'Select…',
    this.comboboxPlaceholder = 'Search…',
    this.comboboxClear = 'Clear',
    this.comboboxEmpty = 'No results',
    this.comboboxShow = 'Show options',
    this.comboboxHide = 'Close options',
    this.popoverTriggerLabel = 'Open',
    this.calendarLabel = 'Calendar',
    this.calendarPrevious = 'Previous',
    this.calendarNext = 'Next',
    this.calendarToday = 'Today',
    this.calendarCurrent = 'today',
    this.calendarRangeStart = 'range start',
    this.calendarRangeEnd = 'range end',
    this.datePickerLabel = 'Date',
    this.datePickerPlaceholder = 'Select a date',
    this.datePickerClear = 'Clear date',
    this.dateRangePickerLabel = 'Date range',
    this.dateRangePickerPlaceholder = 'Select a range',
    this.dateRangePickerClear = 'Clear range',
    this.timeFieldLabel = 'Time',
    this.timeFieldHour = 'Hour',
    this.timeFieldMinute = 'Minute',
    this.timeFieldSecond = 'Second',
    this.timeFieldDayPeriod = 'AM/PM',
    this.timeFieldEmpty = 'Empty',
    this.timeFieldInvalidFormat = 'Enter a time in the expected format.',
    this.timeFieldOutOfRange = 'Enter a time within the allowed range.',
    this.timeFieldSecondsRequired = 'Enter hours, minutes, and seconds.',
    this.timeFieldSecondsNotAllowed = 'Enter hours and minutes only.',
    this.timeFieldRangeUnderflow = 'Enter a time no earlier than {min}.',
    this.timeFieldRangeOverflow = 'Enter a time no later than {max}.',
    this.collapsibleToggle = 'Toggle',
    this.paginationLabel = 'Pagination',
    this.paginationPrevious = 'Go to previous page',
    this.paginationNext = 'Go to next page',
    this.paginationPage = 'Go to page {page}',
    this.paginationCurrent = 'current page',
    this.tableViews = 'Views',
    this.tablePagination = 'Table pages',
    this.tableLoadMore = 'Load more',
    this.tableLoading = 'Loading…',
    this.tableColumns = 'Columns',
    this.tableSelectRow = 'Select {name}',
    this.tableSelectPage = 'Select all visible rows',
    this.tableSelection = 'Selection',
    this.tableNoResults = 'No rows match the current filters',
    this.tableResults = _tableResults,
    this.tableClearFilters = 'Clear filters',
    this.tableView = 'View',
    this.tableViewTable = 'Table',
    this.tableViewCards = 'Cards',
    this.tableSortedAscending = 'sorted ascending',
    this.tableSortedDescending = 'sorted descending',
    this.carouselPrevious = 'Previous slide',
    this.carouselNext = 'Next slide',
    this.carouselChoose = 'Choose slide',
    this.carouselSlide = '{index} of {count}',
    this.carouselGoTo = 'Go to slide {index}',
    this.carouselRoleDescription = 'carousel',
    this.carouselSlideRoleDescription = 'slide',
    this.loginFormHeading = 'Sign in',
    this.loginFormSubmit = 'Sign in',
    this.loginFormForgot = 'Forgot password?',
    this.loginFormEmail = 'Email',
    this.loginFormEmailPlaceholder = 'you@example.com',
    this.loginFormPassword = 'Password',
    this.loginFormDivider = 'or',
    this.loginFormProvider = 'Continue with {name}',
    this.uploadDropAreaPrompt = 'Drag & drop files or',
    this.uploadDropAreaAction = 'browse',
    this.uploadDropAreaBrowse = 'Browse files',
    this.uploadDropAreaRejectedType = '{name} is not an accepted file type.',
    this.uploadDropAreaRejectedCount =
        '{name} was not added: only one file is accepted.',
    this.uploadDropAreaFiles = 'Selected files',
    this.uploadDropAreaRemove = 'Remove {name}',
    this.breadcrumbLabel = 'Breadcrumb',
    this.breadcrumbCurrent = 'current page',
    this.sidebarLabel = 'Main',
    this.sidebarCollapse = 'Collapse the navigation',
    this.sidebarExpand = 'Expand the navigation',
    this.sidebarCurrent = 'current page',
    this.navigationMenuCurrent = 'current page',
    this.treeLoading = 'Loading {name}…',
    this.treeLoadError = 'Could not load {name}. Press Right Arrow to retry.',
    this.treeExpand = 'Expand',
    this.treeCollapse = 'Collapse',
    this.treeRetry = 'Retry',
    this.avatarGroupMore = _avatarGroupMore,
    this.tagRemove = 'Remove',
    this.codeBlockLabel = 'Code',
    this.codeBlockLabelLanguage = 'Code: {language}',
    this.codeBlockSample = 'Code sample',
    this.codeBlockSampleLanguage = 'Code sample, {language}',
    this.codeBlockCopy = 'Copy code',
    this.codeBlockCopyText = 'Copy',
    this.codeBlockCopiedText = 'Copied',
    this.codeBlockCopied = 'Copied to clipboard',
    this.rangeSliderLowerText = '{value}, minimum; may not exceed {bound}',
    this.rangeSliderUpperText = '{value}, maximum; may not go below {bound}',
    this.ratingStars = _ratingStars,
    this.pinInputCell = 'Character {index} of {length}',
    this.stepperLabel = 'Progress',
    this.stepperCompleted = 'Completed',
    this.stepperCurrent = 'current step',
  });

  /// Announced while a control is busy. Catalog key `loading.label`.
  final String loadingLabel;

  /// Shown beside a button after it copied its text, and announced.
  /// Catalog key `button.copied`.
  final String buttonCopied;

  /// The hint of a menu item that opens a submenu. Catalog key
  /// `menu.submenu`.
  final String submenuHint;

  /// The name of a context menu given none. Catalog key
  /// `contextMenu.label`.
  final String contextMenuLabel;

  /// The name of a notification's close button. Catalog key
  /// `inlineNotification.close`.
  final String closeLabel;

  /// The name of the notification region. Catalog key
  /// `notificationRegion.label`.
  final String notificationRegionLabel;

  /// The name of a number field's increment button, with `{label}`.
  /// Catalog key `numberField.increment`.
  final String numberFieldIncrement;

  /// The name of a number field's decrement button, with `{label}`.
  /// Catalog key `numberField.decrement`.
  final String numberFieldDecrement;

  /// Shown when a number field's text is not a number. Catalog key
  /// `numberField.parseError`.
  final String numberFieldParseError;

  /// Shown when a number is below the minimum, with `{min}`. Catalog key
  /// `numberField.rangeUnderflow`.
  final String numberFieldRangeUnderflow;

  /// Shown when a number is above the maximum, with `{max}`. Catalog key
  /// `numberField.rangeOverflow`.
  final String numberFieldRangeOverflow;

  /// Shown when a number is off the step grid, with `{step}`. Catalog key
  /// `numberField.stepMismatch`.
  final String numberFieldStepMismatch;

  /// The name of a dialog's close button and of its dismissible barrier.
  /// Catalog key `dialog.close`.
  final String dialogCloseLabel;

  /// The confirming button of a confirm dialog. Catalog key
  /// `dialog.confirm`.
  final String dialogConfirmLabel;

  /// The cancelling button of a confirm dialog. Catalog key `dialog.cancel`.
  final String dialogCancelLabel;

  /// The acknowledging button of an alert dialog. Catalog key
  /// `dialog.dismiss`.
  final String dialogDismissLabel;

  /// The text of a switch's on state. Catalog key `switch.on`.
  final String switchOn;

  /// The text of a switch's off state. Catalog key `switch.off`.
  final String switchOff;

  /// Shown by a select with nothing chosen. Catalog key
  /// `select.placeholder`.
  final String selectPlaceholder;

  /// Shown in an empty combobox. Catalog key `combobox.placeholder`.
  final String comboboxPlaceholder;

  /// The name of a combobox's clear button. Catalog key
  /// `combobox.clear`.
  final String comboboxClear;

  /// Shown when no option matches a combobox's text. Catalog key
  /// `combobox.empty`.
  final String comboboxEmpty;

  /// The name of a combobox's button while its list is closed.
  /// Catalog key `combobox.show`.
  final String comboboxShow;

  /// The name of a combobox's button while its list is open.
  /// Catalog key `combobox.hide`.
  final String comboboxHide;

  /// The text of a popover trigger given no content of its own.
  /// Catalog key `dialog.trigger`.
  final String popoverTriggerLabel;

  /// The name of a calendar's day grid. Catalog key
  /// `calendar.label`.
  final String calendarLabel;

  /// The name of a calendar's previous-month button. Catalog key
  /// `calendar.previous`.
  final String calendarPrevious;

  /// The name of a calendar's next-month button. Catalog key
  /// `calendar.next`.
  final String calendarNext;

  /// The text of a calendar's Today button. Catalog key
  /// `calendar.today`.
  final String calendarToday;

  /// Appended to the name of today's date. Catalog key
  /// `calendar.current`.
  final String calendarCurrent;

  /// Appended to the name of the first day of a selected range. Catalog key
  /// `calendar.rangeStart`.
  final String calendarRangeStart;

  /// Appended to the name of the last day of a selected range. Catalog key
  /// `calendar.rangeEnd`.
  final String calendarRangeEnd;

  /// The label of a date picker given none. Catalog key
  /// `datePicker.label`.
  final String datePickerLabel;

  /// Shown by an empty date picker. Catalog key
  /// `datePicker.placeholder`.
  final String datePickerPlaceholder;

  /// The name of a date picker's clear button. Catalog key
  /// `datePicker.clear`.
  final String datePickerClear;

  /// The label of a date range picker given none. Catalog key
  /// `dateRangePicker.label`.
  final String dateRangePickerLabel;

  /// Shown by an empty date range picker. Catalog key
  /// `dateRangePicker.placeholder`.
  final String dateRangePickerPlaceholder;

  /// The name of a date range picker's clear button. Catalog key
  /// `dateRangePicker.clear`.
  final String dateRangePickerClear;

  /// The label of a time field given none. Catalog key
  /// `timeField.label`.
  final String timeFieldLabel;

  /// The name of a time field's hour segment. Catalog key
  /// `timeField.hour`.
  final String timeFieldHour;

  /// The name of a time field's minute segment. Catalog key
  /// `timeField.minute`.
  final String timeFieldMinute;

  /// The name of a time field's second segment. Catalog key
  /// `timeField.second`.
  final String timeFieldSecond;

  /// The name of a time field's AM/PM segment. Catalog key
  /// `timeField.dayPeriod`.
  final String timeFieldDayPeriod;

  /// The value read for an empty time segment. Catalog key
  /// `timeField.empty`.
  final String timeFieldEmpty;

  /// Shown when a time value is not in the expected format. Catalog key
  /// `timeField.invalidFormat`.
  final String timeFieldInvalidFormat;

  /// Shown when a time value has a segment out of its range. Catalog key
  /// `timeField.outOfRange`.
  final String timeFieldOutOfRange;

  /// Shown when a time value lacks the seconds the field needs. Catalog key
  /// `timeField.secondsRequired`.
  final String timeFieldSecondsRequired;

  /// Shown when a time value has seconds the field does not take. Catalog key
  /// `timeField.secondsNotAllowed`.
  final String timeFieldSecondsNotAllowed;

  /// Shown when a time is before the minimum, with `{min}`. Catalog key
  /// `timeField.rangeUnderflow`.
  final String timeFieldRangeUnderflow;

  /// Shown when a time is after the maximum, with `{max}`. Catalog key
  /// `timeField.rangeOverflow`.
  final String timeFieldRangeOverflow;

  /// The text of a collapsible's trigger given no label. Catalog key
  /// `collapsible.toggle`.
  final String collapsibleToggle;

  /// The name of a pagination's navigation. Catalog key
  /// `pagination.label`.
  final String paginationLabel;

  /// The name of a pagination's previous-page button. Catalog key
  /// `pagination.previous`.
  final String paginationPrevious;

  /// The name of a pagination's next-page button. Catalog key
  /// `pagination.next`.
  final String paginationNext;

  /// The name of a pagination's page button, with `{page}`. Catalog key
  /// `pagination.page`.
  final String paginationPage;

  /// Read with a pagination's current page. Catalog key
  /// `pagination.current`.
  final String paginationCurrent;

  /// The name of a table set's view tabs. Catalog key
  /// `table.views`.
  final String tableViews;

  /// The name of a table's pagination. Catalog key
  /// `table.pagination`.
  final String tablePagination;

  /// The button that loads more rows. Catalog key
  /// `table.loadMore`.
  final String tableLoadMore;

  /// Shown and announced while rows load. Catalog key
  /// `table.loading`.
  final String tableLoading;

  /// The column visibility button and its panel. Catalog key
  /// `table.columns`.
  final String tableColumns;

  /// The name of a row's selection checkbox, with `{name}`. Catalog key
  /// `table.selectRow`.
  final String tableSelectRow;

  /// The name of the checkbox that selects the rows shown. Catalog key
  /// `table.selectPage`.
  final String tableSelectPage;

  /// The name of the selection column's header in single mode. Catalog key
  /// `table.selection`.
  final String tableSelection;

  /// The title of the no-results state. Catalog key
  /// `table.noResults`.
  final String tableNoResults;

  /// Announced when filtering changes the row count, a function of the count, so a translation picks its own plural forms. Catalog key
  /// `table.results`.
  final String Function(int count) tableResults;

  /// The no-results state's action. Catalog key
  /// `table.clearFilters`.
  final String tableClearFilters;

  /// The name of the switch between the table and the cards. Catalog key
  /// `table.view`.
  final String tableView;

  /// The table choice of that switch. Catalog key
  /// `table.viewTable`.
  final String tableViewTable;

  /// The cards choice of that switch. Catalog key
  /// `table.viewCards`.
  final String tableViewCards;

  /// Read with the header of a column sorted ascending. Catalog key
  /// `table.sortedAscending`.
  final String tableSortedAscending;

  /// Read with the header of a column sorted descending. Catalog key
  /// `table.sortedDescending`.
  final String tableSortedDescending;

  /// The name of a carousel's previous button. Catalog key
  /// `carousel.previous`.
  final String carouselPrevious;

  /// The name of a carousel's next button. Catalog key
  /// `carousel.next`.
  final String carouselNext;

  /// The name of a carousel's slide picker. Catalog key
  /// `carousel.choose`.
  final String carouselChoose;

  /// The name of a slide, with `{index}` and `{count}`. Catalog key
  /// `carousel.slide`.
  final String carouselSlide;

  /// The name of a slide picker button, with `{index}`. Catalog key
  /// `carousel.goTo`.
  final String carouselGoTo;

  /// Read as what a carousel is. Catalog key
  /// `carousel.roleDescription`.
  final String carouselRoleDescription;

  /// Read as what a slide is. Catalog key
  /// `carousel.slideRoleDescription`.
  final String carouselSlideRoleDescription;

  /// The heading of a sign-in form. Catalog key
  /// `loginForm.heading`.
  final String loginFormHeading;

  /// The submit button of a sign-in form. Catalog key
  /// `loginForm.submit`.
  final String loginFormSubmit;

  /// The forgotten password link. Catalog key
  /// `loginForm.forgot`.
  final String loginFormForgot;

  /// The email field's label. Catalog key
  /// `loginForm.email`.
  final String loginFormEmail;

  /// The email field's placeholder. Catalog key
  /// `loginForm.emailPlaceholder`.
  final String loginFormEmailPlaceholder;

  /// The password field's label. Catalog key
  /// `loginForm.password`.
  final String loginFormPassword;

  /// Between the provider buttons and the fields. Catalog key
  /// `loginForm.divider`.
  final String loginFormDivider;

  /// A provider button, with `{name}`. Catalog key
  /// `loginForm.provider`.
  final String loginFormProvider;

  /// The upload area's prompt where it takes dropped files. Catalog key
  /// `uploadDropArea.prompt`.
  final String uploadDropAreaPrompt;

  /// The action word after the prompt. Catalog key
  /// `uploadDropArea.action`.
  final String uploadDropAreaAction;

  /// The upload area's text where it takes no dropped files. Catalog key
  /// `uploadDropArea.browse`.
  final String uploadDropAreaBrowse;

  /// Shown and announced for a file of a type the area does not accept, with `{name}`. Catalog key
  /// `uploadDropArea.rejectedType`.
  final String uploadDropAreaRejectedType;

  /// Shown and announced for a file past the one-file limit, with `{name}`. Catalog key
  /// `uploadDropArea.rejectedCount`.
  final String uploadDropAreaRejectedCount;

  /// The name of the upload area's file list. Catalog key
  /// `uploadDropArea.files`.
  final String uploadDropAreaFiles;

  /// The name of a file's remove button, with `{name}`. Catalog key
  /// `uploadDropArea.remove`.
  final String uploadDropAreaRemove;

  /// The name of a breadcrumb trail given none. Catalog key
  /// `breadcrumb.label`.
  final String breadcrumbLabel;

  /// Read with a breadcrumb trail's current page. Catalog key
  /// `breadcrumb.current`.
  final String breadcrumbCurrent;

  /// The name of a sidebar's navigation given none. Catalog key
  /// `sidebar.label`.
  final String sidebarLabel;

  /// The name of a sidebar's rail toggle while the sidebar is open. Catalog
  /// key `sidebar.collapse`.
  final String sidebarCollapse;

  /// The name of a sidebar's rail toggle while it is a rail. Catalog key
  /// `sidebar.expand`.
  final String sidebarExpand;

  /// Read with a sidebar's current destination. Catalog key
  /// `sidebar.current`.
  final String sidebarCurrent;

  /// Read with a navigation menu's current link. Catalog key
  /// `navigationMenu.current`.
  final String navigationMenuCurrent;

  /// Read while a tree item's children load, with `{name}`. Catalog key
  /// `tree.loading`.
  final String treeLoading;

  /// Read when a tree item's children failed to load, with `{name}`.
  /// Catalog key `tree.loadError`.
  final String treeLoadError;

  /// The custom action that expands a tree branch. Catalog key
  /// `tree.expand`.
  final String treeExpand;

  /// The custom action that collapses a tree branch. Catalog key
  /// `tree.collapse`.
  final String treeCollapse;

  /// The custom action that loads a branch's children again after they
  /// failed to load. Catalog key `tree.retry`.
  final String treeRetry;

  /// The name of an avatar group's "+N" chip, from the number of avatars
  /// left out. Catalog key `avatarGroup.more`, a plural message: a
  /// translation is a function that picks the plural form of its language.
  final String Function(int count) avatarGroupMore;

  /// The name of a tag's remove button. Catalog key `tag.remove`.
  final String tagRemove;

  /// The name of a code block. Catalog key `codeBlock.label`.
  final String codeBlockLabel;

  /// The name of a code block with a caption, with `{language}`.
  /// Catalog key `codeBlock.labelLanguage`.
  final String codeBlockLabelLanguage;

  /// The name of a code block's scroller. Catalog key
  /// `codeBlock.sample`.
  final String codeBlockSample;

  /// The name of a code block's scroller with a caption, with
  /// `{language}`. Catalog key `codeBlock.sampleLanguage`.
  final String codeBlockSampleLanguage;

  /// The name of a code block's copy button. Catalog key
  /// `codeBlock.copy`.
  final String codeBlockCopy;

  /// The visible text of a code block's copy button. Catalog key
  /// `codeBlock.copyText`.
  final String codeBlockCopyText;

  /// The visible text of a code block's copy button after a copy.
  /// Catalog key `codeBlock.copiedText`.
  final String codeBlockCopiedText;

  /// Announced after a code block copied its code. Catalog key
  /// `codeBlock.copied`.
  final String codeBlockCopied;

  /// The value text of a range slider's lower thumb, with `{value}` and the
  /// `{bound}` it may not pass. Catalog key `rangeSlider.lowerText`.
  final String rangeSliderLowerText;

  /// The value text of a range slider's upper thumb, with `{value}` and the
  /// `{bound}` it may not pass. Catalog key `rangeSlider.upperText`.
  final String rangeSliderUpperText;

  /// The name of a rating star, a function of its count, so a translation
  /// picks its own plural forms. Catalog key `rating.stars`.
  final String Function(int count) ratingStars;

  /// The name of a PIN input cell, with `{index}` and `{length}`. Catalog
  /// key `pinInput.cell`.
  final String pinInputCell;

  /// The default name of a stepper. Catalog key `stepper.label`.
  final String stepperLabel;

  /// Read after a completed step's label. Catalog key `stepper.completed`.
  final String stepperCompleted;

  /// Read with the current step. Catalog key `stepper.current`.
  final String stepperCurrent;

  /// [message] with each `{name}` placeholder replaced from [values].
  static String fill(String message, Map<String, String> values) =>
      message.replaceAllMapped(
        RegExp(r'\{(\w+)\}'),
        (match) => values[match.group(1)] ?? match.group(0)!,
      );

  /// A copy with the given messages replaced.
  InvisibleMessages copyWith({
    String? loadingLabel,
    String? buttonCopied,
    String? submenuHint,
    String? contextMenuLabel,
    String? closeLabel,
    String? notificationRegionLabel,
    String? numberFieldIncrement,
    String? numberFieldDecrement,
    String? numberFieldParseError,
    String? numberFieldRangeUnderflow,
    String? numberFieldRangeOverflow,
    String? numberFieldStepMismatch,
    String? dialogCloseLabel,
    String? dialogConfirmLabel,
    String? dialogCancelLabel,
    String? dialogDismissLabel,
    String? switchOn,
    String? switchOff,
    String? selectPlaceholder,
    String? comboboxPlaceholder,
    String? comboboxClear,
    String? comboboxEmpty,
    String? comboboxShow,
    String? comboboxHide,
    String? popoverTriggerLabel,
    String? calendarLabel,
    String? calendarPrevious,
    String? calendarNext,
    String? calendarToday,
    String? calendarCurrent,
    String? calendarRangeStart,
    String? calendarRangeEnd,
    String? datePickerLabel,
    String? datePickerPlaceholder,
    String? datePickerClear,
    String? dateRangePickerLabel,
    String? dateRangePickerPlaceholder,
    String? dateRangePickerClear,
    String? timeFieldLabel,
    String? timeFieldHour,
    String? timeFieldMinute,
    String? timeFieldSecond,
    String? timeFieldDayPeriod,
    String? timeFieldEmpty,
    String? timeFieldInvalidFormat,
    String? timeFieldOutOfRange,
    String? timeFieldSecondsRequired,
    String? timeFieldSecondsNotAllowed,
    String? timeFieldRangeUnderflow,
    String? timeFieldRangeOverflow,
    String? collapsibleToggle,
    String? paginationLabel,
    String? paginationPrevious,
    String? paginationNext,
    String? paginationPage,
    String? paginationCurrent,
    String? tableViews,
    String? tablePagination,
    String? tableLoadMore,
    String? tableLoading,
    String? tableColumns,
    String? tableSelectRow,
    String? tableSelectPage,
    String? tableSelection,
    String? tableNoResults,
    String Function(int count)? tableResults,
    String? tableClearFilters,
    String? tableView,
    String? tableViewTable,
    String? tableViewCards,
    String? tableSortedAscending,
    String? tableSortedDescending,
    String? carouselPrevious,
    String? carouselNext,
    String? carouselChoose,
    String? carouselSlide,
    String? carouselGoTo,
    String? carouselRoleDescription,
    String? carouselSlideRoleDescription,
    String? loginFormHeading,
    String? loginFormSubmit,
    String? loginFormForgot,
    String? loginFormEmail,
    String? loginFormEmailPlaceholder,
    String? loginFormPassword,
    String? loginFormDivider,
    String? loginFormProvider,
    String? uploadDropAreaPrompt,
    String? uploadDropAreaAction,
    String? uploadDropAreaBrowse,
    String? uploadDropAreaRejectedType,
    String? uploadDropAreaRejectedCount,
    String? uploadDropAreaFiles,
    String? uploadDropAreaRemove,
    String? breadcrumbLabel,
    String? breadcrumbCurrent,
    String? sidebarLabel,
    String? sidebarCollapse,
    String? sidebarExpand,
    String? sidebarCurrent,
    String? navigationMenuCurrent,
    String? treeLoading,
    String? treeLoadError,
    String? treeExpand,
    String? treeCollapse,
    String? treeRetry,
    String Function(int count)? avatarGroupMore,
    String? tagRemove,
    String? codeBlockLabel,
    String? codeBlockLabelLanguage,
    String? codeBlockSample,
    String? codeBlockSampleLanguage,
    String? codeBlockCopy,
    String? codeBlockCopyText,
    String? codeBlockCopiedText,
    String? codeBlockCopied,
    String? rangeSliderLowerText,
    String? rangeSliderUpperText,
    String Function(int count)? ratingStars,
    String? pinInputCell,
    String? stepperLabel,
    String? stepperCompleted,
    String? stepperCurrent,
  }) {
    return InvisibleMessages(
      loadingLabel: loadingLabel ?? this.loadingLabel,
      buttonCopied: buttonCopied ?? this.buttonCopied,
      submenuHint: submenuHint ?? this.submenuHint,
      contextMenuLabel: contextMenuLabel ?? this.contextMenuLabel,
      closeLabel: closeLabel ?? this.closeLabel,
      notificationRegionLabel:
          notificationRegionLabel ?? this.notificationRegionLabel,
      numberFieldIncrement: numberFieldIncrement ?? this.numberFieldIncrement,
      numberFieldDecrement: numberFieldDecrement ?? this.numberFieldDecrement,
      numberFieldParseError:
          numberFieldParseError ?? this.numberFieldParseError,
      numberFieldRangeUnderflow:
          numberFieldRangeUnderflow ?? this.numberFieldRangeUnderflow,
      numberFieldRangeOverflow:
          numberFieldRangeOverflow ?? this.numberFieldRangeOverflow,
      numberFieldStepMismatch:
          numberFieldStepMismatch ?? this.numberFieldStepMismatch,
      dialogCloseLabel: dialogCloseLabel ?? this.dialogCloseLabel,
      dialogConfirmLabel: dialogConfirmLabel ?? this.dialogConfirmLabel,
      dialogCancelLabel: dialogCancelLabel ?? this.dialogCancelLabel,
      dialogDismissLabel: dialogDismissLabel ?? this.dialogDismissLabel,
      switchOn: switchOn ?? this.switchOn,
      switchOff: switchOff ?? this.switchOff,
      selectPlaceholder: selectPlaceholder ?? this.selectPlaceholder,
      comboboxPlaceholder: comboboxPlaceholder ?? this.comboboxPlaceholder,
      comboboxClear: comboboxClear ?? this.comboboxClear,
      comboboxEmpty: comboboxEmpty ?? this.comboboxEmpty,
      comboboxShow: comboboxShow ?? this.comboboxShow,
      comboboxHide: comboboxHide ?? this.comboboxHide,
      popoverTriggerLabel: popoverTriggerLabel ?? this.popoverTriggerLabel,
      calendarLabel: calendarLabel ?? this.calendarLabel,
      calendarPrevious: calendarPrevious ?? this.calendarPrevious,
      calendarNext: calendarNext ?? this.calendarNext,
      calendarToday: calendarToday ?? this.calendarToday,
      calendarCurrent: calendarCurrent ?? this.calendarCurrent,
      calendarRangeStart: calendarRangeStart ?? this.calendarRangeStart,
      calendarRangeEnd: calendarRangeEnd ?? this.calendarRangeEnd,
      datePickerLabel: datePickerLabel ?? this.datePickerLabel,
      datePickerPlaceholder:
          datePickerPlaceholder ?? this.datePickerPlaceholder,
      datePickerClear: datePickerClear ?? this.datePickerClear,
      dateRangePickerLabel: dateRangePickerLabel ?? this.dateRangePickerLabel,
      dateRangePickerPlaceholder:
          dateRangePickerPlaceholder ?? this.dateRangePickerPlaceholder,
      dateRangePickerClear: dateRangePickerClear ?? this.dateRangePickerClear,
      timeFieldLabel: timeFieldLabel ?? this.timeFieldLabel,
      timeFieldHour: timeFieldHour ?? this.timeFieldHour,
      timeFieldMinute: timeFieldMinute ?? this.timeFieldMinute,
      timeFieldSecond: timeFieldSecond ?? this.timeFieldSecond,
      timeFieldDayPeriod: timeFieldDayPeriod ?? this.timeFieldDayPeriod,
      timeFieldEmpty: timeFieldEmpty ?? this.timeFieldEmpty,
      timeFieldInvalidFormat:
          timeFieldInvalidFormat ?? this.timeFieldInvalidFormat,
      timeFieldOutOfRange: timeFieldOutOfRange ?? this.timeFieldOutOfRange,
      timeFieldSecondsRequired:
          timeFieldSecondsRequired ?? this.timeFieldSecondsRequired,
      timeFieldSecondsNotAllowed:
          timeFieldSecondsNotAllowed ?? this.timeFieldSecondsNotAllowed,
      timeFieldRangeUnderflow:
          timeFieldRangeUnderflow ?? this.timeFieldRangeUnderflow,
      timeFieldRangeOverflow:
          timeFieldRangeOverflow ?? this.timeFieldRangeOverflow,
      collapsibleToggle: collapsibleToggle ?? this.collapsibleToggle,
      paginationLabel: paginationLabel ?? this.paginationLabel,
      paginationPrevious: paginationPrevious ?? this.paginationPrevious,
      paginationNext: paginationNext ?? this.paginationNext,
      paginationPage: paginationPage ?? this.paginationPage,
      paginationCurrent: paginationCurrent ?? this.paginationCurrent,
      tableViews: tableViews ?? this.tableViews,
      tablePagination: tablePagination ?? this.tablePagination,
      tableLoadMore: tableLoadMore ?? this.tableLoadMore,
      tableLoading: tableLoading ?? this.tableLoading,
      tableColumns: tableColumns ?? this.tableColumns,
      tableSelectRow: tableSelectRow ?? this.tableSelectRow,
      tableSelectPage: tableSelectPage ?? this.tableSelectPage,
      tableSelection: tableSelection ?? this.tableSelection,
      tableNoResults: tableNoResults ?? this.tableNoResults,
      tableResults: tableResults ?? this.tableResults,
      tableClearFilters: tableClearFilters ?? this.tableClearFilters,
      tableView: tableView ?? this.tableView,
      tableViewTable: tableViewTable ?? this.tableViewTable,
      tableViewCards: tableViewCards ?? this.tableViewCards,
      tableSortedAscending: tableSortedAscending ?? this.tableSortedAscending,
      tableSortedDescending:
          tableSortedDescending ?? this.tableSortedDescending,
      carouselPrevious: carouselPrevious ?? this.carouselPrevious,
      carouselNext: carouselNext ?? this.carouselNext,
      carouselChoose: carouselChoose ?? this.carouselChoose,
      carouselSlide: carouselSlide ?? this.carouselSlide,
      carouselGoTo: carouselGoTo ?? this.carouselGoTo,
      carouselRoleDescription:
          carouselRoleDescription ?? this.carouselRoleDescription,
      carouselSlideRoleDescription:
          carouselSlideRoleDescription ?? this.carouselSlideRoleDescription,
      loginFormHeading: loginFormHeading ?? this.loginFormHeading,
      loginFormSubmit: loginFormSubmit ?? this.loginFormSubmit,
      loginFormForgot: loginFormForgot ?? this.loginFormForgot,
      loginFormEmail: loginFormEmail ?? this.loginFormEmail,
      loginFormEmailPlaceholder:
          loginFormEmailPlaceholder ?? this.loginFormEmailPlaceholder,
      loginFormPassword: loginFormPassword ?? this.loginFormPassword,
      loginFormDivider: loginFormDivider ?? this.loginFormDivider,
      loginFormProvider: loginFormProvider ?? this.loginFormProvider,
      uploadDropAreaPrompt: uploadDropAreaPrompt ?? this.uploadDropAreaPrompt,
      uploadDropAreaAction: uploadDropAreaAction ?? this.uploadDropAreaAction,
      uploadDropAreaBrowse: uploadDropAreaBrowse ?? this.uploadDropAreaBrowse,
      uploadDropAreaRejectedType:
          uploadDropAreaRejectedType ?? this.uploadDropAreaRejectedType,
      uploadDropAreaRejectedCount:
          uploadDropAreaRejectedCount ?? this.uploadDropAreaRejectedCount,
      uploadDropAreaFiles: uploadDropAreaFiles ?? this.uploadDropAreaFiles,
      uploadDropAreaRemove: uploadDropAreaRemove ?? this.uploadDropAreaRemove,
      breadcrumbLabel: breadcrumbLabel ?? this.breadcrumbLabel,
      breadcrumbCurrent: breadcrumbCurrent ?? this.breadcrumbCurrent,
      sidebarLabel: sidebarLabel ?? this.sidebarLabel,
      sidebarCollapse: sidebarCollapse ?? this.sidebarCollapse,
      sidebarExpand: sidebarExpand ?? this.sidebarExpand,
      sidebarCurrent: sidebarCurrent ?? this.sidebarCurrent,
      navigationMenuCurrent:
          navigationMenuCurrent ?? this.navigationMenuCurrent,
      treeLoading: treeLoading ?? this.treeLoading,
      treeLoadError: treeLoadError ?? this.treeLoadError,
      treeExpand: treeExpand ?? this.treeExpand,
      treeCollapse: treeCollapse ?? this.treeCollapse,
      treeRetry: treeRetry ?? this.treeRetry,
      avatarGroupMore: avatarGroupMore ?? this.avatarGroupMore,
      tagRemove: tagRemove ?? this.tagRemove,
      codeBlockLabel: codeBlockLabel ?? this.codeBlockLabel,
      codeBlockLabelLanguage:
          codeBlockLabelLanguage ?? this.codeBlockLabelLanguage,
      codeBlockSample: codeBlockSample ?? this.codeBlockSample,
      codeBlockSampleLanguage:
          codeBlockSampleLanguage ?? this.codeBlockSampleLanguage,
      codeBlockCopy: codeBlockCopy ?? this.codeBlockCopy,
      codeBlockCopyText: codeBlockCopyText ?? this.codeBlockCopyText,
      codeBlockCopiedText: codeBlockCopiedText ?? this.codeBlockCopiedText,
      codeBlockCopied: codeBlockCopied ?? this.codeBlockCopied,
      rangeSliderLowerText: rangeSliderLowerText ?? this.rangeSliderLowerText,
      rangeSliderUpperText: rangeSliderUpperText ?? this.rangeSliderUpperText,
      ratingStars: ratingStars ?? this.ratingStars,
      pinInputCell: pinInputCell ?? this.pinInputCell,
      stepperLabel: stepperLabel ?? this.stepperLabel,
      stepperCompleted: stepperCompleted ?? this.stepperCompleted,
      stepperCurrent: stepperCurrent ?? this.stepperCurrent,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is InvisibleMessages &&
      other.loadingLabel == loadingLabel &&
      other.buttonCopied == buttonCopied &&
      other.submenuHint == submenuHint &&
      other.contextMenuLabel == contextMenuLabel &&
      other.closeLabel == closeLabel &&
      other.notificationRegionLabel == notificationRegionLabel &&
      other.numberFieldIncrement == numberFieldIncrement &&
      other.numberFieldDecrement == numberFieldDecrement &&
      other.numberFieldParseError == numberFieldParseError &&
      other.numberFieldRangeUnderflow == numberFieldRangeUnderflow &&
      other.numberFieldRangeOverflow == numberFieldRangeOverflow &&
      other.numberFieldStepMismatch == numberFieldStepMismatch &&
      other.dialogCloseLabel == dialogCloseLabel &&
      other.dialogConfirmLabel == dialogConfirmLabel &&
      other.dialogCancelLabel == dialogCancelLabel &&
      other.dialogDismissLabel == dialogDismissLabel &&
      other.switchOn == switchOn &&
      other.switchOff == switchOff &&
      other.selectPlaceholder == selectPlaceholder &&
      other.comboboxPlaceholder == comboboxPlaceholder &&
      other.comboboxClear == comboboxClear &&
      other.comboboxEmpty == comboboxEmpty &&
      other.comboboxShow == comboboxShow &&
      other.comboboxHide == comboboxHide &&
      other.popoverTriggerLabel == popoverTriggerLabel &&
      other.calendarLabel == calendarLabel &&
      other.calendarPrevious == calendarPrevious &&
      other.calendarNext == calendarNext &&
      other.calendarToday == calendarToday &&
      other.calendarCurrent == calendarCurrent &&
      other.calendarRangeStart == calendarRangeStart &&
      other.calendarRangeEnd == calendarRangeEnd &&
      other.datePickerLabel == datePickerLabel &&
      other.datePickerPlaceholder == datePickerPlaceholder &&
      other.datePickerClear == datePickerClear &&
      other.dateRangePickerLabel == dateRangePickerLabel &&
      other.dateRangePickerPlaceholder == dateRangePickerPlaceholder &&
      other.dateRangePickerClear == dateRangePickerClear &&
      other.timeFieldLabel == timeFieldLabel &&
      other.timeFieldHour == timeFieldHour &&
      other.timeFieldMinute == timeFieldMinute &&
      other.timeFieldSecond == timeFieldSecond &&
      other.timeFieldDayPeriod == timeFieldDayPeriod &&
      other.timeFieldEmpty == timeFieldEmpty &&
      other.timeFieldInvalidFormat == timeFieldInvalidFormat &&
      other.timeFieldOutOfRange == timeFieldOutOfRange &&
      other.timeFieldSecondsRequired == timeFieldSecondsRequired &&
      other.timeFieldSecondsNotAllowed == timeFieldSecondsNotAllowed &&
      other.timeFieldRangeUnderflow == timeFieldRangeUnderflow &&
      other.timeFieldRangeOverflow == timeFieldRangeOverflow &&
      other.collapsibleToggle == collapsibleToggle &&
      other.paginationLabel == paginationLabel &&
      other.paginationPrevious == paginationPrevious &&
      other.paginationNext == paginationNext &&
      other.paginationPage == paginationPage &&
      other.paginationCurrent == paginationCurrent &&
      other.tableViews == tableViews &&
      other.tablePagination == tablePagination &&
      other.tableLoadMore == tableLoadMore &&
      other.tableLoading == tableLoading &&
      other.tableColumns == tableColumns &&
      other.tableSelectRow == tableSelectRow &&
      other.tableSelectPage == tableSelectPage &&
      other.tableSelection == tableSelection &&
      other.tableNoResults == tableNoResults &&
      other.tableResults == tableResults &&
      other.tableClearFilters == tableClearFilters &&
      other.tableView == tableView &&
      other.tableViewTable == tableViewTable &&
      other.tableViewCards == tableViewCards &&
      other.tableSortedAscending == tableSortedAscending &&
      other.tableSortedDescending == tableSortedDescending &&
      other.carouselPrevious == carouselPrevious &&
      other.carouselNext == carouselNext &&
      other.carouselChoose == carouselChoose &&
      other.carouselSlide == carouselSlide &&
      other.carouselGoTo == carouselGoTo &&
      other.carouselRoleDescription == carouselRoleDescription &&
      other.carouselSlideRoleDescription == carouselSlideRoleDescription &&
      other.loginFormHeading == loginFormHeading &&
      other.loginFormSubmit == loginFormSubmit &&
      other.loginFormForgot == loginFormForgot &&
      other.loginFormEmail == loginFormEmail &&
      other.loginFormEmailPlaceholder == loginFormEmailPlaceholder &&
      other.loginFormPassword == loginFormPassword &&
      other.loginFormDivider == loginFormDivider &&
      other.loginFormProvider == loginFormProvider &&
      other.uploadDropAreaPrompt == uploadDropAreaPrompt &&
      other.uploadDropAreaAction == uploadDropAreaAction &&
      other.uploadDropAreaBrowse == uploadDropAreaBrowse &&
      other.uploadDropAreaRejectedType == uploadDropAreaRejectedType &&
      other.uploadDropAreaRejectedCount == uploadDropAreaRejectedCount &&
      other.uploadDropAreaFiles == uploadDropAreaFiles &&
      other.uploadDropAreaRemove == uploadDropAreaRemove &&
      other.breadcrumbLabel == breadcrumbLabel &&
      other.breadcrumbCurrent == breadcrumbCurrent &&
      other.sidebarLabel == sidebarLabel &&
      other.sidebarCollapse == sidebarCollapse &&
      other.sidebarExpand == sidebarExpand &&
      other.sidebarCurrent == sidebarCurrent &&
      other.navigationMenuCurrent == navigationMenuCurrent &&
      other.treeLoading == treeLoading &&
      other.treeLoadError == treeLoadError &&
      other.treeExpand == treeExpand &&
      other.treeCollapse == treeCollapse &&
      other.treeRetry == treeRetry &&
      other.avatarGroupMore == avatarGroupMore &&
      other.tagRemove == tagRemove &&
      other.codeBlockLabel == codeBlockLabel &&
      other.codeBlockLabelLanguage == codeBlockLabelLanguage &&
      other.codeBlockSample == codeBlockSample &&
      other.codeBlockSampleLanguage == codeBlockSampleLanguage &&
      other.codeBlockCopy == codeBlockCopy &&
      other.codeBlockCopyText == codeBlockCopyText &&
      other.codeBlockCopiedText == codeBlockCopiedText &&
      other.codeBlockCopied == codeBlockCopied &&
      other.rangeSliderLowerText == rangeSliderLowerText &&
      other.rangeSliderUpperText == rangeSliderUpperText &&
      other.ratingStars == ratingStars &&
      other.pinInputCell == pinInputCell &&
      other.stepperLabel == stepperLabel &&
      other.stepperCompleted == stepperCompleted &&
      other.stepperCurrent == stepperCurrent;

  @override
  int get hashCode => Object.hashAll([
    loadingLabel,
    buttonCopied,
    submenuHint,
    contextMenuLabel,
    closeLabel,
    notificationRegionLabel,
    numberFieldIncrement,
    numberFieldDecrement,
    numberFieldParseError,
    numberFieldRangeUnderflow,
    numberFieldRangeOverflow,
    numberFieldStepMismatch,
    dialogCloseLabel,
    dialogConfirmLabel,
    dialogCancelLabel,
    dialogDismissLabel,
    switchOn,
    switchOff,
    selectPlaceholder,
    comboboxPlaceholder,
    comboboxClear,
    comboboxEmpty,
    comboboxShow,
    comboboxHide,
    popoverTriggerLabel,
    calendarLabel,
    calendarPrevious,
    calendarNext,
    calendarToday,
    calendarCurrent,
    calendarRangeStart,
    calendarRangeEnd,
    datePickerLabel,
    datePickerPlaceholder,
    datePickerClear,
    dateRangePickerLabel,
    dateRangePickerPlaceholder,
    dateRangePickerClear,
    timeFieldLabel,
    timeFieldHour,
    timeFieldMinute,
    timeFieldSecond,
    timeFieldDayPeriod,
    timeFieldEmpty,
    timeFieldInvalidFormat,
    timeFieldOutOfRange,
    timeFieldSecondsRequired,
    timeFieldSecondsNotAllowed,
    timeFieldRangeUnderflow,
    timeFieldRangeOverflow,
    collapsibleToggle,
    paginationLabel,
    paginationPrevious,
    paginationNext,
    paginationPage,
    paginationCurrent,
    tableViews,
    tablePagination,
    tableLoadMore,
    tableLoading,
    tableColumns,
    tableSelectRow,
    tableSelectPage,
    tableSelection,
    tableNoResults,
    tableResults,
    tableClearFilters,
    tableView,
    tableViewTable,
    tableViewCards,
    tableSortedAscending,
    tableSortedDescending,
    carouselPrevious,
    carouselNext,
    carouselChoose,
    carouselSlide,
    carouselGoTo,
    carouselRoleDescription,
    carouselSlideRoleDescription,
    loginFormHeading,
    loginFormSubmit,
    loginFormForgot,
    loginFormEmail,
    loginFormEmailPlaceholder,
    loginFormPassword,
    loginFormDivider,
    loginFormProvider,
    uploadDropAreaPrompt,
    uploadDropAreaAction,
    uploadDropAreaBrowse,
    uploadDropAreaRejectedType,
    uploadDropAreaRejectedCount,
    uploadDropAreaFiles,
    uploadDropAreaRemove,
    breadcrumbLabel,
    breadcrumbCurrent,
    sidebarLabel,
    sidebarCollapse,
    sidebarExpand,
    sidebarCurrent,
    navigationMenuCurrent,
    treeLoading,
    treeLoadError,
    treeExpand,
    treeCollapse,
    treeRetry,
    avatarGroupMore,
    tagRemove,
    codeBlockLabel,
    codeBlockLabelLanguage,
    codeBlockSample,
    codeBlockSampleLanguage,
    codeBlockCopy,
    codeBlockCopyText,
    codeBlockCopiedText,
    codeBlockCopied,
    rangeSliderLowerText,
    rangeSliderUpperText,
    ratingStars,
    pinInputCell,
    stepperLabel,
    stepperCompleted,
    stepperCurrent,
  ]);
}
