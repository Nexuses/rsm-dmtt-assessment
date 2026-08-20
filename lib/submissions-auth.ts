import type { NextApiRequest } from "next";
import type { NextRequest } from "next/server";

export const SUBMISSIONS_COOKIE_NAME = "submissions_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.SUBMISSIONS_PASSWORD || "";
}

function base64UrlEncode(value: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function isSubmissionsPasswordConfigured() {
  return Boolean(getSecret());
}

export function createSignedAuthCookieValue() {
  return `authorized.${base64UrlEncode(getSecret())}`;
}

export function isValidSignedAuthCookieValue(cookieValue?: string | null) {
  if (!cookieValue || !isSubmissionsPasswordConfigured()) {
    return false;
  }

  const [payload, token] = cookieValue.split(".");
  if (!payload || !token) {
    return false;
  }

  return payload === "authorized" && token === base64UrlEncode(getSecret());
}

export function getSubmissionsCookieHeader() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SUBMISSIONS_COOKIE_NAME}=${createSignedAuthCookieValue()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}

export function getClearSubmissionsCookieHeader() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SUBMISSIONS_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function isAuthenticatedRequest(req: NextApiRequest) {
  return isValidSignedAuthCookieValue(req.cookies[SUBMISSIONS_COOKIE_NAME]);
}

export function isAuthenticatedMiddlewareRequest(req: NextRequest) {
  return isValidSignedAuthCookieValue(req.cookies.get(SUBMISSIONS_COOKIE_NAME)?.value);
}
