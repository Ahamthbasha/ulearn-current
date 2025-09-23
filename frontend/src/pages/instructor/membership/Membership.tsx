import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  instructorViewMemberships,
  retrieveActiveMembershipPlan,
} from "../../../api/action/InstructorActionApi";
import Card from "../../../components/common/Card";
import {
  BadgeCheck,
  ShieldCheck,
  Clock,
  Crown,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { type MembershipPlan } from "../interface/instructorInterface";

const Membership: React.FC = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [activePlanExpiryDate, setActivePlanExpiryDate] = useState<
    string | null
  >(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const [plansData, activeData] = await Promise.all([
          instructorViewMemberships(),
          retrieveActiveMembershipPlan(),
        ]);

        setPlans(plansData);
        setActivePlanId(activeData?.planId ?? null);
        setActivePlanExpiryDate(activeData?.expiryDate ?? null);
      } catch (error: any) {
        toast.error("Failed to load membership data.");
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading plans...</p>;

  return (
    <div className="p-6">
      {/* ✅ Benefits Overview */}
      <div className="max-w-3xl mx-auto mb-10">
        <h2 className="text-2xl font-bold text-center mb-4">
          Why Become a Mentor?
        </h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-center gap-2">
            <ShieldCheck className="text-green-600 w-5 h-5" />
            Access slot scheduling tools
          </li>
          <li className="flex items-center gap-2">
            <Clock className="text-blue-500 w-5 h-5" />
            Increase visibility and credibility
          </li>
          <li className="flex items-center gap-2">
            <Crown className="text-yellow-500 w-5 h-5" />
            Earn more by mentoring students
          </li>
        </ul>
      </div>

      {/* ✅ Membership Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isActive = plan._id === activePlanId;

          return (
            <Card
              key={plan._id}
              withShadow
              padded
              className={`hover:shadow-lg transition ${
                isActive ? "border-2 border-green-500 bg-green-50" : ""
              }`}
              header={
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <BadgeCheck className="h-5 w-5" />
                  <span>{plan.name}</span>
                </div>
              }
              footer={
                isActive ? (
                  <div className="text-green-600 font-medium text-center">
                    Current Plan
                    {activePlanExpiryDate && (
                      <p className="text-xs text-gray-600 mt-1">
                        Expires on:{" "}
                        {new Date(activePlanExpiryDate)
                          .toLocaleDateString("en-GB")
                          .replace(/\//g, "-")}
                      </p>
                    )}
                  </div>
                ) : activePlanId ? (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg cursor-not-allowed"
                    onClick={() =>
                      toast.info("You already have an active membership.")
                    }
                  >
                    Buy Plan
                  </button>
                ) : (
                  <button
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                    onClick={() =>
                      navigate(`/instructor/membership/checkout/${plan._id}`)
                    }
                  >
                    Buy Plan
                  </button>
                )
              }
            >
              <p>
                <strong>Duration:</strong> {plan.durationInDays} days
              </p>
              {plan.price !== undefined && (
                <p className="mt-2">
                  <strong>Price:</strong> ₹{plan.price}
                </p>
              )}
              {plan.description && (
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
              )}

              {/* ✅ Show Benefits */}
              {plan.benefits && plan.benefits.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {plan.benefits.map((benefit, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <CheckCircle className="text-green-500 w-4 h-4" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Membership;
