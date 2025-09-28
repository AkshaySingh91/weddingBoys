import Process from "./Process"
import EventTypes from "./EventTypes"
import FoodItems from "./FoodItems"
import dharaaLogo from "../../../Asset/Dharaa/Logo.png"
import catering from "../../../Asset/Dharaa/Food/catering.jpg"

export default function DharaaLandingPage() {
    return (
        <div className="min-h-screen">
            <section className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16 pt-10 pb-16 px-4 sm:px-6 lg:px-20">
                {/* Left Content */}
                <div className="w-full lg:w-1/2 text-center lg:text-left">
                    <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                        Premium Catering For{" "}
                        <br className="hidden lg:inline" />
                        <span className="text-orange-600">Every Occasion</span>
                    </h1>
                    <p className="mt-4 text-gray-600 max-w-lg mx-auto lg:mx-0 text-sm sm:text-base">
                        Dharaa Event Management brings you fresh, customized catering
                        packages under our trusted parent company WeddingBoys.in. Let us
                        make your event memorable.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mt-8">
                        <button className="bg-orange-600 text-white px-6 sm:px-8 py-3 rounded-xl shadow-lg hover:bg-orange-700 transition-all font-semibold sm:font-bold text-base sm:text-lg">
                            Explore Packages
                        </button>
                        <button
                            className="border border-orange-600 text-orange-600 px-6 sm:px-8 py-3 rounded-xl hover:bg-orange-50 transition-all font-semibold sm:font-bold text-base sm:text-lg"
                            onClick={() =>
                                window.open(`https://wa.me/9054794444`, "_blank")
                            }
                        >
                            Contact Us
                        </button>
                    </div>
                </div>

                {/* Right Image & Logo */}
                <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-end relative">
                    <div className="flex items-center justify-center mx-auto mb-10 md:mb-0">
                        <img
                            src={dharaaLogo}
                            alt="Dharaa Event Management Logo"
                            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 object-contain"
                        />
                        <div className="ml-3 tracking-wider">
                            <h2 className="text-xl sm:text-2xl lg:text-2xl font-extrabold text-gray-900">
                                Dharaa
                            </h2>
                            <h2 className="text-xl sm:text-2xl lg:text-2xl font-extrabold text-gray-900">
                                Event Management
                            </h2>
                        </div>
                    </div>

                    <img
                        src={catering}
                        alt="Catering setup"
                        className="w-full max-w-sm sm:max-w-md lg:max-w-lg object-cover rounded-3xl shadow-2xl border-8 border-white"
                    />
                </div>
            </section>

            <Process />
            <EventTypes />
            <FoodItems />
        </div>
    )
}
