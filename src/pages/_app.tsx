import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Header from "../components/Header";

const App = ({ Component, pageProps }: AppProps): React.ReactElement => (
  <>
    <Header />
    <Component {...pageProps} />
  </>
);

export default App;
