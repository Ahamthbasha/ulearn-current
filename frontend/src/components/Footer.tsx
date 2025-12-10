const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-lg font-semibold mb-2">Explore Our Courses</p>
        <p className="text-sm">
          Ulearn offers a wide range of tech courses guided by expert instructors.
          Whether you're a beginner or looking to upskill, we’ve got you covered.
        </p>
        <p className="mt-4 text-sm text-gray-400">© {new Date().getFullYear()} Ulearn. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
