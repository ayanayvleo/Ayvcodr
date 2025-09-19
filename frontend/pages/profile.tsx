
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ProfilePage() {
  // Redirect to dashboard/settings
  if (typeof window !== "undefined") {
    window.location.replace("/dashboard/settings");
    return null;
  }
  return null;
}
