import Image from "next/image";
import Link from "next/link";

const Header = () => {
  return (
    <header>
      <div className="logo-container">
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: "16px" }}
        >
          <Image
            alt="Stytch Logo"
            src="stytch-logo.svg"
            width={120}
            height={32}
            priority={true}
          />
          <div className="logo-divider">x</div>
          <Image
            alt="Dynamic Logo"
            src="dynamic-logo.svg"
            width={120}
            height={32}
            priority={true}
          />
        </Link>
      </div>
      <div className="link-container">
        <Link
          className="header"
          target="_blank"
          href="https://www.dynamic.xyz/docs/javascript-sdk"
        >
          Dynamic Docs
        </Link>
        <Link
          className="header"
          target="_blank"
          href="https://www.stytch.com/docs/home"
        >
          Stytch Docs
        </Link>
        <Link
          className="header"
          target="_blank"
          href="https://github.com/dynamic-labs/examples/tree/main/examples/nextjs-external-jwt-stytch"
        >
          <Image
            alt="Github"
            src="github.svg"
            width={20}
            height={20}
            style={{ marginRight: "4px" }}
          />
          View on Github
        </Link>
      </div>
    </header>
  );
};

export default Header;
