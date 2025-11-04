import { useReservationStore } from "~/stores/reservation";

function firstString(v: unknown): string | null {
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : null;
  return typeof v === "string" ? v : null;
}

export default defineNuxtRouteMiddleware((to) => {
  const store = useReservationStore();

  // LIFF が付けてくる liff.state を見る
  const rawLiffState = firstString(to.query["liff.state"]);

  if (rawLiffState) {
    // "/?recommendedClass=abc&recommendedCourse=def" みたいなのが入ってる
    const decoded = decodeURIComponent(rawLiffState);

    const innerUrl = new URL(
      decoded.startsWith("/") ? `https://dummy${decoded}` : `https://dummy/${decoded}`
    );

    const rc = innerUrl.searchParams.get("recommendedClass");
    const rco = innerUrl.searchParams.get("recommendedCourse");

    if (rc) store.recommendedClassId = rc;
    if (rco) store.recommendedCourseId = rco;

    // URLをきれいにしておくと2回目以降の遷移が楽
    return navigateTo({
      // LIFFが "/somepage?..." を渡してきたらそっちに寄せる
      path: innerUrl.pathname === "/" ? to.path : innerUrl.pathname,
      query: Object.fromEntries(innerUrl.searchParams.entries()),
      replace: true,
    });
  }

  // 普通にクエリで来ているパターン（ブラウザで直接開いたときなど）
  const rc = firstString(to.query.recommendedClass);
  const rco = firstString(to.query.recommendedCourse);

  if (rc) store.recommendedClassId = rc;
  if (rco) store.recommendedCourseId = rco;
});
