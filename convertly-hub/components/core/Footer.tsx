const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background-secondary border-border mt-auto border-t">
      <div className="text-text-secondary container mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-6 text-center text-sm leading-6">
        <span className="whitespace-nowrap">
          &copy; {currentYear} Convertly Hub. All rights reserved.
        </span>
        <span className="whitespace-nowrap">
          Support:{' '}
          <a
            className="text-accent hover:text-accent-hover rounded-sm font-medium underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            href="mailto:support@bon.kharkov.ua"
          >
            support@bon.kharkov.ua
          </a>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
