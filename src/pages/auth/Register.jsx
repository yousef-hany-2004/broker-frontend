import { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../../validation/registerSchema";
import { registerUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import egyptLocations from "../../data/egyptLocations";

const steps = [StepOne, StepTwo, StepThree];

function Register() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const methods = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    shouldUnregister: false,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      address: {
        country: "",
        city: "",
        street: "",
        state: "",
        zipCode: "",
      },
    },
  });

  const totalSteps = steps.length;
  const CurrentStep = steps[step - 1];

  const stepFields = [
    ["firstName", "lastName", "email", "phoneNumber"],
    [
      "address.country",
      "address.city",
      "address.street",
      "address.state",
      "address.zipCode",
    ],
    ["password", "confirmPassword"],
  ];

  const variants = {
    enter: (direction) => ({
      x: direction === 1 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction === 1 ? -100 : 100,
      opacity: 0,
    }),
  };

  const nextStep = async () => {
    const isValid = await methods.trigger(stepFields[step - 1]);

    if (!isValid) return;

    if (step < totalSteps) {
      setDirection(1);
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const result = await registerUser(data);

      if (result.succeeded) {
        toast.success("Account created successfully!");
        navigate("/login");
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      const message = err.response?.data?.message;
      toast.error(message || "Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-jost bg-[var(--dark)]">
      {/* LEFT SIDE */}
      <div className="relative flex-1 hidden md:flex flex-col justify-end p-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--dark)] via-[#0d0d0d]/50 to-[#0d0d0d]/20" />

        <div className="absolute top-12 left-16 z-10 font-cormorant text-2xl tracking-[4px] uppercase text-[var(--gold)]">
          Aqua<span className="text-[var(--cream)]">Keys</span>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-4">
            Join Us Today
          </p>
          <h1 className="font-cormorant text-5xl font-light leading-tight text-[var(--cream)] mb-4">
            Begin Your
            <br />
            <em className="italic text-[var(--gold-light)]">
              Property Journey
            </em>
          </h1>
          <p className="text-sm text-[#f5f0e8]/50 font-light leading-relaxed max-w-sm">
            Create your account and gain access to exclusive real estate
            listings curated for you.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full md:w-[480px] shrink-0 bg-[var(--dark-2)] flex flex-col justify-center px-14 py-16 border-l border-[#c1aa77]/10">
        <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
          Create Account
        </p>
        <h2 className="font-cormorant text-4xl font-normal text-[var(--cream)] mb-2">
          Get Started
        </h2>
        <p className="text-sm text-[#f5f0e8]/40 mb-8 tracking-wide">
          Step {step} of {totalSteps}
        </p>

        {/* Progress Dots */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-[2px] flex-1 transition-all duration-300 ${
                s <= step ? "bg-[var(--gold)]" : "bg-[#c1aa77]/20"
              }`}
            />
          ))}
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
              >
                <CurrentStep
                  next={nextStep}
                  back={prevStep}
                  loading={loading}
                />
              </motion.div>
            </AnimatePresence>
          </form>
        </FormProvider>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-[#c1aa77]/10" />
          <span className="text-[10px] tracking-[2px] uppercase text-[#f5f0e8]/20">
            or
          </span>
          <div className="flex-1 h-px bg-[#c1aa77]/10" />
        </div>

        <div className="text-center text-xs text-[#f5f0e8]/30 tracking-wide">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

function StepOne({ next }) {
  const {
    register,
    formState: { errors },
    trigger,
  } = useFormContext();

  const fields = ["firstName", "lastName", "email", "phoneNumber"];

  const handleNext = async () => {
    const valid = await trigger(fields);
    if (valid) next();
  };

  return (
    <>
      <h2 className="font-cormorant text-2xl text-[var(--cream)] mb-8">
        Personal Information
      </h2>

      {fields.map((field) => (
        <div key={field} className="mb-6">
          <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
            {field.replace(/([A-Z])/g, " $1")}
          </label>
          <input
            type={field === "email" ? "email" : "text"}
            {...register(field)}
            className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 ${
              errors[field]
                ? "border-red-400"
                : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
            }`}
          />

          {errors[field] && (
            <p className="text-red-400 text-xs mt-2 tracking-wide">
              {errors[field].message}
            </p>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={handleNext}
        className="w-full py-4 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300 mt-2"
      >
        Next Step
      </button>
    </>
  );
}

function StepTwo({ next, back }) {
  const {
    register,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = useFormContext();

  const [governorates, setGovernorates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);

  const selectedState = watch("address.state");

  useEffect(() => {
    const fetchGovernorates = async () => {
      try {
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries/states",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: "EG" }),
          },
        );
        const data = await res.json();
        if (!data.error && data.data?.states) {
          setGovernorates(data.data.states.map((s) => s.name));
        } else {
          setGovernorates(egyptLocations.map((g) => g.state));
        }
      } catch {
        setGovernorates(egyptLocations.map((g) => g.state));
      } finally {
        setLoadingStates(false);
      }
    };

    fetchGovernorates();
    setValue("address.country", "EG");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedState) return;

    setCities([]);
    setValue("address.city", "");

    const fetchCities = async () => {
      try {
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries/state/cities",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: "EG", state: selectedState }),
          },
        );
        const data = await res.json();
        if (!data.error && data.data?.length) {
          setCities(data.data);
        } else {
          const found = egyptLocations.find((g) => g.state === selectedState);
          setCities(found ? found.cities : []);
        }
      } catch {
        const found = egyptLocations.find((g) => g.state === selectedState);
        setCities(found ? found.cities : []);
      }
    };

    fetchCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState]);

  const fields = ["street", "zipCode"];

  const handleNext = async () => {
    const valid = await trigger([
      "address.country",
      "address.state",
      "address.city",
      "address.street",
      "address.zipCode",
    ]);
    if (valid) next();
  };

  const selectClass = (hasError) =>
    `w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm outline-none transition-colors duration-300 cursor-pointer ${
      hasError
        ? "border-red-400"
        : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
    }`;

  return (
    <>
      <h2 className="font-cormorant text-2xl text-[var(--cream)] mb-8">
        Address Information
      </h2>

      {/* Country */}
      <div className="mb-6">
        <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
          Country
        </label>
        <select
          {...register("address.country")}
          className={selectClass(errors.address?.country)}
        >
          <option value="EG" className="bg-[#1a1a1a]">
            EG
          </option>
        </select>
        {errors.address?.country && (
          <p className="text-red-400 text-xs mt-2 tracking-wide">
            {errors.address.country.message}
          </p>
        )}
      </div>

      {/* State */}
      <div className="mb-6">
        <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
          Governorate
        </label>
        <select
          {...register("address.state")}
          className={selectClass(errors.address?.state)}
          disabled={loadingStates}
        >
          <option value="" className="bg-[#1a1a1a]">
            {loadingStates ? "Loading..." : "Select Governorate"}
          </option>
          {governorates.map((gov) => (
            <option key={gov} value={gov} className="bg-[#1a1a1a]">
              {gov}
            </option>
          ))}
        </select>
        {errors.address?.state && (
          <p className="text-red-400 text-xs mt-2 tracking-wide">
            {errors.address.state.message}
          </p>
        )}
      </div>

      {/* City */}
      <div className="mb-6">
        <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
          City
        </label>
        <select
          {...register("address.city")}
          className={selectClass(errors.address?.city)}
          disabled={!selectedState || cities.length === 0}
        >
          <option value="" className="bg-[#1a1a1a]">
            {!selectedState
              ? "Select Governorate first"
              : cities.length === 0
                ? "Loading..."
                : "Select City"}
          </option>
          {cities.map((city) => (
            <option key={city} value={city} className="bg-[#1a1a1a]">
              {city}
            </option>
          ))}
        </select>
        {errors.address?.city && (
          <p className="text-red-400 text-xs mt-2 tracking-wide">
            {errors.address.city.message}
          </p>
        )}
      </div>

      {/* Street + ZipCode */}
      {fields.map((field) => (
        <div key={field} className="mb-6">
          <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
            {field === "zipCode" ? "Zip Code" : field}
          </label>
          <input
            type="text"
            {...register(`address.${field}`)}
            className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 ${
              errors.address?.[field]
                ? "border-red-400"
                : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
            }`}
          />
          {errors.address?.[field] && (
            <p className="text-red-400 text-xs mt-2 tracking-wide">
              {errors.address[field].message}
            </p>
          )}
        </div>
      ))}

      <div className="flex gap-4 mt-2">
        <button
          type="button"
          onClick={back}
          className="flex-1 py-4 bg-transparent border border-[#c1aa77]/30 hover:border-[var(--gold)] text-[var(--gold)] text-xs tracking-[4px] uppercase transition-all duration-300"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-4 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300"
        >
          Next Step
        </button>
      </div>
    </>
  );
}

function StepThree({ back, loading }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    formState: { errors, touchedFields },
  } = useFormContext();

  return (
    <>
      <h2 className="font-cormorant text-2xl text-[var(--cream)] mb-8">
        Account Setup
      </h2>

      <div className="mb-6 relative">
        <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
          Password
        </label>
        <input
          type={showPassword ? "text" : "password"}
          {...register("password")}
          placeholder="••••••••"
          className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 pr-8 ${
            !touchedFields.password
              ? "border-[#c1aa77]/20 focus:border-[var(--gold)]"
              : errors.password
                ? "border-red-400"
                : "border-[var(--gold)]"
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-0 bottom-3 text-[#f5f0e8]/30 hover:text-[var(--gold)] transition-colors"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        {errors.password && (
          <p className="text-red-400 text-xs mt-2 tracking-wide">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="mb-8 relative">
        <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
          Confirm Password
        </label>
        <input
          type={showConfirmPassword ? "text" : "password"}
          {...register("confirmPassword")}
          placeholder="••••••••"
          className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 pr-8 ${
            !touchedFields.confirmPassword
              ? "border-[#c1aa77]/20 focus:border-[var(--gold)]"
              : errors.confirmPassword
                ? "border-red-400"
                : "border-[var(--gold)]"
          }`}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword((prev) => !prev)}
          className="absolute right-0 bottom-3 text-[#f5f0e8]/30 hover:text-[var(--gold)] transition-colors"
        >
          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        {errors.confirmPassword && (
          <p className="text-red-400 text-xs mt-2 tracking-wide">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={back}
          className="flex-1 py-4 bg-transparent border border-[#c1aa77]/30 hover:border-[var(--gold)] text-[var(--gold)] text-xs tracking-[4px] uppercase transition-all duration-300"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 py-4 text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300 ${
            loading
              ? "bg-[#c1aa77]/50 cursor-not-allowed"
              : "bg-[var(--gold)] hover:bg-[var(--gold-light)]"
          }`}
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </div>
    </>
  );
}

export default Register;
