const team = [
  { name: "Ahamathbasha F", role: "Founder & CEO" },
  { name: "Nangopan", role: "CTO" },
  { name: "Sundar", role: "Lead Designer" },
];

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-white px-6 py-12 md:px-20 lg:px-32">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
          About Us
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-10">
          Welcome to <span className="font-semibold text-blue-600">uLearn</span>
          , your trusted platform for personalized mentorship and expert
          learning. We connect learners with industry professionals to
          accelerate their careers through one-on-one sessions, structured
          courses, and real-world insights.
        </p>
      </div>

      <section className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto mt-10">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 leading-relaxed">
            We aim to democratize access to quality mentorship by bringing
            together top mentors from various fields—technology, data, business,
            and more—onto a single platform. Our goal is to empower students and
            professionals to grow faster, smarter, and with clarity.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Why Choose uLearn?
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>One-on-one mentorship sessions</li>
            <li>Skilled instructors with real-world experience</li>
            <li>Flexible scheduling and booking</li>
            <li>Performance-driven learning paths</li>
            <li>Affordable pricing and secure payments</li>
          </ul>
        </div>
      </section>

      <section className="max-w-5xl mx-auto mt-16">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
          Meet Our Team
        </h2>
        <p className="text-center text-gray-600 mb-6">
          We're a passionate group of educators, engineers, and innovators
          committed to reshaping education through mentorship.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-center">
          {team.map((member, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-24 h-24 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xl mb-2">
                {getInitials(member.name)}
              </div>
              <p className="font-semibold text-gray-800">{member.name}</p>
              <p className="text-sm text-gray-500">{member.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;
