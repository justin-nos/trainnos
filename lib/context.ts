"use client";
import {createContext} from "react";
import {useEffect, useState} from "react";
import {onAuthStateChanged} from "firebase/auth";
import {authAdmins} from "./firebaseAdmins";

export const AdminContext = createContext({
  admin: null,
  email: null,
  adminLevel: null,
});

export const AuthContext = createContext({id: ""});
