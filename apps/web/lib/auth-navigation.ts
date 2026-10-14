type SessionCache = {
  cancelQueries: () => Promise<void>;
  clear: () => void;
};

export function isAuthPage(pathname: string) {
  return pathname === "/login" || pathname === "/logout";
}

export async function signOut(
  postLogout: () => Promise<unknown>,
  cache: SessionCache,
  navigate: (path: string) => void,
) {
  await postLogout();
  await cache.cancelQueries();
  cache.clear();
  navigate("/logout");
}
