import { FC } from 'react';

interface GitHubAvatarProps {
  namespace: string | undefined;
  width: number | undefined;
  height: number | undefined;
}

export const GitHubAvatar: FC<GitHubAvatarProps> = ({ namespace, width, height }) => {
  const imageUrl = `https://github.com/${namespace}.png`;

  return (
    <img
      className="rounded-circle"
      src={imageUrl}
      alt={`Avatar for ${namespace}`}
      height={height}
      width={width}
    />
  );
};
