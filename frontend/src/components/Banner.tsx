import bannerImg from '../assets/banner.jpg';

const Banner = () => {
  return (
    <div className="w-full aspect-[16/9]">
      <img
        src={bannerImg}
        alt="Ulearn Banner"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default Banner;
