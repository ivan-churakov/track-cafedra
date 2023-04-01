import {useRouter} from "next/router";

const Topic = () => {
  const router = useRouter();
  const slug = router.query?.slug
  console.log(slug)
  return (
    <div>
      {slug}
    </div>
  );
};

export default Topic;