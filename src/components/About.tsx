"use client";

import React from "react";
import { motion } from "framer-motion";

const About = () => {
    return (
        <motion.section
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.6 }}
            className=" mt-12 px-6 md:px-12 flex flex-col items-center justify-center gap-12">
            {/* Title Animation */}
            <div className="">
                <motion.h2
                    className="text-2xl md:text-3xl font-medium text-gray-700/50 mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    About us
                </motion.h2>
            </div>

            <div className="flex w-full max-w-3xl flex-col gap-12">
                {/* First Content Block */}
                <motion.div
                    className="bg-white rounded-xl shadow-md p-6 md:p-10 border border-gray-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex items-center gap-4">
                        <span className="text-5xl md:text-6xl font-bold [-webkit-text-stroke:1px_gray] text-white ">
                            01
                        </span>
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-800/45">
                                The first AI in The Health Industry
                            </h3>
                            <p className="text-gray-600 mt-2">
                                The first AI in The Health Industry
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Second Content Block */}
                <motion.div
                    className="bg-white rounded-xl shadow-md p-6 md:p-10 border border-gray-200"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <div className="flex items-center gap-4">
                        <span className="text-5xl md:text-6xl font-bold [-webkit-text-stroke:1px_gray] text-white ">
                            02
                        </span>
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-800/45">
                                The first AI in The Health Industry
                            </h3>
                            <p className="text-gray-600 mt-2">
                                The first AI in The Health Industry
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Button Animation */}
            <motion.button
                className="flex items-center justify-center gap-2 bg-gray-800 p-2 border rounded-full shadow-none text-white hover:bg-blue-400 duration-500 transition"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
            >
                Check Out more <span className="ml-1">→</span>
            </motion.button>
        </motion.section>
    );
};

export default About;
