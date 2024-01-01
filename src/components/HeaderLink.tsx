interface HeaderLinkProps {
  url: string;
  text: string;
}

const HeaderLink: React.FC<HeaderLinkProps> = ({ url, text }) => (
  <a href={url} className="text-violet-500 hover:text-violet-700 p-2">
    {text}
  </a>
);

export default HeaderLink;
