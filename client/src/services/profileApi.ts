import { api } from "./api";

export interface Profile {
  name: string;
  age: string;
  gender: string;
  state: string;
  district: string;
  occupation: string;
  income: string;
  education: string;
  disability: string;
  language: string;
  phone: string;
  role?: string;
  rawText?: string;
}

export function getProfile() {
  return api<Profile>("/profile");
}

export function saveProfile(profile: Profile) {
  return api("/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}