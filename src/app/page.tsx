import { redirect } from 'next/navigation'

export default function Home() {
  console.log("Entered the default page")
  redirect('/admin')
}