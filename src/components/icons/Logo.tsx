import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="https://firebasestorage.googleapis.com/v0/b/studio-56609462-aefda.appspot.com/o/assets%2Flogo.png?alt=media&token=8d249539-5586-4531-b856-787c9343e0e7"
      alt="Ruby Catalogue Logo"
      width={140}
      height={32}
      priority
    />
  );
}
