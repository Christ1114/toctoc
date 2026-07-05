import React from 'react'

type Props = {
  videoId: string;
}

const YoutubeVideo = ({ videoId }: Props) => {
  return (
    <iframe
      width="100%"
      height="100%"
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className=' w-200 h-110 flex items-center justify-center '
      style={{ borderRadius: '20px' }}
    />
  )
}

export default YoutubeVideo