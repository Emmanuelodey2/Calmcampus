"use client";

import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

const Hero = () => {
    return (
        <div className="flex flex-col text-center px-6">
            <main className="flex flex-col items-center justify-center md:gap-16 gap-14">
                <div className="md:mt-12 mt-6">
                    <motion.p
                        className="text-sm text-gray-600"
                        initial={{ opacity: 0  }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        January 23rd 2025
                    </motion.p>

                    <motion.h2
                        className="text-4xl md:text-6xl mx-auto md:max-w-3xl h-1/2 block items-center justify-center font-[Poltawski] italic mt-4"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        Welcome Your Personalized Health AI Hermes
                    </motion.h2>
                </div>

                <motion.p
                    className="mt-4 text-gray-700 max-w-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                >
                    Our AI for Health is here to listen and guide you through tough
                    moments, providing helpful strategies to improve your mental and
                    physical health.
                </motion.p>

                <div className="mt-6 flex items-center justify-center md:flex-row flex-col gap-x-8 gap-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        <Button className="liquid-effect-button hover:bg-blue-400  flex items-center justify-center gap-2 px-6 py-3 border rounded-full shadow-md transition duration-500">
                            chat with your bot <span className="ml-1 w-6 aspect-square rounded-full">→ </span>
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                    >
                        <Link href="#" className="text-gray-800 font-medium hover:underline">
                            Download Hermes for desktop &gt;
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    >
                        <Link href="#" className="text-gray-800 font-medium hover:underline">
                            Learn about Hermes &gt;
                        </Link>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Hero;
