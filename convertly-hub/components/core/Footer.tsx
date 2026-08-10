const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background-secondary border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-text-secondary">
        &copy; {currentYear} Convertly Hub. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
