import React from "react";

export function getAuthToken() {
  return localStorage.getItem("link_haven_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("link_haven_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("link_haven_token");
}
