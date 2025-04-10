export function Footer() {
    const currentYear = new Date().getFullYear();
    
    return (
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 md:px-6">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} Cold Email Generator. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-xs hover:underline underline-offset-4"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-xs hover:underline underline-offset-4"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    );
  }