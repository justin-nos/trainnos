"use client";
import Image from "next/legacy/image";
import logoPNG from "../../public/NOSWHITE_1.png";
import logoPNGBlack from "../../public/NOSLogo.png";
import Link from "next/link";
import {useState, useEffect} from "react";
import {Dialog, DialogPanel} from "@headlessui/react";
import {Bars3Icon, XMarkIcon} from "@heroicons/react/24/outline";
import {usePathname} from "next/navigation";

const navigation = [
  {
    name: "Meet Us",
    href: {
      pathname: "/meet",
    },
  },
  {
    name: "Pricing",
    href: {
      pathname: "/pricing",
    },
  },
  {
    name: "Testimonials",
    href: {
      pathname: "/testimonials",
    },
  },
];

const whiteBGPaths = [
  "/meet",
  "/pricing",
  "/admins/login",
  "/testimonials",
  "/diet",
];
const dontDisplayNavPaths = ["/admins"];

export default function Navbar({}) {
  const pathName = usePathname();
  const [needBlackText, setNeedBlackText] = useState(false);
  useEffect(() => {
    console.log(pathName);
    if (whiteBGPaths.includes(pathName)) {
      console.log("Nav needs Black text!!");
      setNeedBlackText(true);
    } else {
      console.log("Nav needs White Text!!");
      setNeedBlackText(false);
    }
  }, [pathName]);
  return dontDisplayNavPaths.includes(pathName) ? (
    <></>
  ) : (
    <DefaultHeader needBlackTextPass={needBlackText} />
  );
}

function DefaultHeader({needBlackTextPass}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav
        className={`flex items-center justify-between p-6 lg:px-8 ${
          needBlackTextPass ? "text-black" : "text-white"
        }`}
        aria-label="Global"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">NOS</span>
            <Image
              className="h-8 w-auto "
              src={needBlackTextPass ? logoPNGBlack : logoPNG}
              alt="Logo of No Off Season"
            />
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map(item => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-semibold leading-6 ${
                needBlackTextPass ? "text-black" : "text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Link
            href="https://trainnos.pushpress.com/landing/plans"
            className="text-sm font-semibold leading-6 "
          >
            View Plans <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </nav>
      <Dialog
        className="lg:hidden"
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
      >
        <div className="fixed inset-0 z-50 " />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="-m-1.5 p-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">NOS</span>
              <Image className="h-8 w-auto" src={logoPNG} alt="" />
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/25">
              <div className="space-y-2 py-6">
                {navigation.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-gray-800`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                <Link
                  href="https://trainnos.pushpress.com/landing/plans"
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-gray-800"
                >
                  View Plans
                </Link>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
