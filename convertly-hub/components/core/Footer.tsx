const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background-secondary border-border mt-auto border-t">
      <div className="text-text-secondary container mx-auto px-4 py-6 text-center">
        &copy; {currentYear} Convertly Hub. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
