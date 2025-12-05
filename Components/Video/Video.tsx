export function Video(props: any) {
  return (
    <video className="w-full h-full" width="320" height="240" controls autoPlay loop muted>
      <source src={props.src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
}