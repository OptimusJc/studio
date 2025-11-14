import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/icon.svg"
      alt="Ruby Catalogue Logo"
      width={140}
      height={32}
      priority
      className={cn(className)}
    />
  );
}
