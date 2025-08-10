import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-12">
      <div className="container mx-auto text-center">
        <div className="mb-4">
          <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-300">
            利用規約
          </Link>
        </div>
        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} あいもん. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
