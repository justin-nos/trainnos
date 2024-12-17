'use client';
import Image from 'next/image';
import pricingimage from '../../public/nos-pricing.JPEG';

export default function Pricing({}) {
  return (
    <main className="w-screen h-screen relative">
      <Image src={pricingimage} className="absolute inset-x-0 inset-y-0 object-contain" alt="" />
    </main>
  );
}
