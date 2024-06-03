type Props = {
  height: number;
  width: number;
};

export const DefaultUserAvatar = (props: Props) => {
  const { height, width } = props;
  return (
    <img
      className="rounded-circle border border-secondary"
      src="/default_user.png"
      alt={`Avatar for a user without a GitHub account`}
      height={height}
      width={width}
    />
  );
};
