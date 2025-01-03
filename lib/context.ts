"use client";
import {createContext} from "react";

export const AdminContext = createContext({
  admin: null,
  email: null,
  adminLevel: null,
});
