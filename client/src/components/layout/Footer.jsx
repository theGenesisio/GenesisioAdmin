const Footer = () => {
  return (
    <footer className='relative w-full text-center bg-transparent text-text-light text-sm mt-auto mb-1 hidden lg:block'>
      © {new Date().getFullYear()} <span className='font-bold'>Genesisio</span>
      <br /> All rights reserved.
    </footer>
  );
};

export default Footer;
