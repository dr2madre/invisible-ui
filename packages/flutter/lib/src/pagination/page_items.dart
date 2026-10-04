import 'dart:math' as math;

// The page list of `core/src/pagination/state.ts`, in Dart. It takes data
// and returns data, so the shared vectors in core/src/pagination/__vectors__
// hold both implementations to the same answers.

/// [page] within 1 and [pageCount]; a page count below one counts as one.
int clampPage(int page, int pageCount) => page.clamp(1, math.max(pageCount, 1));

List<int> _range(int start, int end) =>
    start > end ? const [] : [for (var i = start; i <= end; i++) i];

/// The pages a pagination shows around [page], null standing for a gap of
/// two or more hidden pages: [boundaryCount] pages at each end and
/// [siblingCount] on each side of the current page, as in
/// "1 … 4 5 6 … 20". A single hidden page is shown instead of a gap.
List<int?> pageItems({
  required int page,
  required int pageCount,
  int siblingCount = 1,
  int boundaryCount = 1,
}) {
  if (pageCount <= boundaryCount * 2 + siblingCount * 2 + 3) {
    return _range(1, pageCount);
  }
  final siblingsStart = math.max(
    math.min(
      page - siblingCount,
      pageCount - boundaryCount - siblingCount * 2 - 1,
    ),
    boundaryCount + 2,
  );
  final siblingsEnd = math.min(
    math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    pageCount - boundaryCount - 1,
  );
  return [
    ..._range(1, boundaryCount),
    siblingsStart > boundaryCount + 2 ? null : boundaryCount + 1,
    ..._range(siblingsStart, siblingsEnd),
    siblingsEnd < pageCount - boundaryCount - 1
        ? null
        : pageCount - boundaryCount,
    ..._range(pageCount - boundaryCount + 1, pageCount),
  ];
}
