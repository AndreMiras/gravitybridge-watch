import Link from "next/link";
import HeaderLink from "./HeaderLink";

const Header = (): JSX.Element => (
  <header className="flex justify-between items-center p-4">
    <h1 className="text-violet-700">
      <Link href="/">Gravity Bridge Orchestrator Watcher</Link>
    </h1>
    <nav>
      <HeaderLink
        url="https://github.com/AndreMiras/gravitybridge-watch"
        text="About"
      />
      <HeaderLink url="https://grafana.gravitybridge.watch" text="Grafana" />
      <HeaderLink url="/metrics" text="/metrics" />
      <HeaderLink
        url="/api/get-last-observed-eth-nonce/"
        text="/get-last-observed-eth-nonce"
      />
      <HeaderLink
        url="/api/get-validator-info-map/"
        text="/get-validator-info-map"
      />
    </nav>
  </header>
);

export default Header;
