import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { useSession } from '@/context/SessionContext';

export default function InitialsScreen() {
    const { session, submitInitials } = useSession();
    const [initials, setInitials] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow letters, max 2 chars
        const val = e.target.value
            .toUpperCase()
            .replace(/[^A-Z]/g, '')
            .slice(0, 2);
        setInitials(val);
    };

    const handleBegin = async () => {
        if (initials.length > 0) {
            setIsStarting(true);
            try {
                await submitInitials(initials);
            } catch (err) {
                console.error('Failed to submit initials', err);
                setIsStarting(false);
            }
        }
    };

    return (
        <div className="min-h-[100dvh] w-full bg-background font-sans text-foreground selection:bg-primary/10 selection:text-primary overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-xl mx-auto px-6 py-12 md:py-24 space-y-12"
            >
                {/* 1. Logo Area */}
                <div className="flex justify-between items-center">
                    <img src="/TA-logo.svg" alt="TalentArbor" className="h-24 w-auto object-contain" />
                    <img src="/rangam-logo.webp" alt="Rangam" className="h-12 w-auto object-contain" />
                </div>

                {/* 2. Primary Heading */}
                <div className="space-y-4 text-left">
                    <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-primary leading-tight">
                        Interview Practice Session
                    </h1>
                </div>

                {/* 3. Introductory Copy & 4. Reassurance */}
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed text-left">
                    <p>
                        You’ll be asked a series of interview-style questions related to a role you applied for.
                        Your progress is saved automatically, and you can leave and return at any time using
                        this link.
                    </p>

                    <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10 shadow-sm">
                        <p className="text-lg text-muted-foreground">
                            This is a practice experience, not a live interview.
                        </p>
                    </div>
                </div>

                {/* 5. Visibility Statement */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-start">
                    <span>The person who shared this link may review your responses to help guide your preparation. Only you can see coaching feedback received during practice.</span>
                </div>

                {/* 6. Initials Input */}
                <div className="space-y-4">
                    <label htmlFor="initials-input" className="block text-lg font-medium text-foreground">
                        Enter your initials to begin
                    </label>
                    <div className="relative group">
                        <input
                            id="initials-input"
                            type="text"
                            value={initials}
                            onChange={handleInputChange}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder="(e.g. AB)"
                            className={cn(
                                'w-full px-4 py-4 text-2xl tracking-widest font-medium bg-muted/50 border rounded-xl outline-none transition-all duration-200',
                                'placeholder:text-muted-foreground/70 placeholder:font-normal placeholder:tracking-normal',
                                isFocused
                                    ? 'border-primary ring-4 ring-primary/10'
                                    : 'border-border hover:border-input'
                            )}
                        />
                        {/* Feedback Text */}
                        <p className="mt-2 text-sm text-muted-foreground">
                            *Used to confirm the session was opened by the intended person. ({session?.candidateName || "Candidate"})
                        </p>
                    </div>
                </div>

                {/* 7. Primary CTA */}
                <div className="pt-4 pb-8">
                    <Button
                        onClick={handleBegin}
                        disabled={initials.length === 0 || isStarting}
                        className={cn(
                            'w-full md:w-auto px-8 py-6 text-lg rounded-xl transition-all duration-200 shadow-sm h-auto',
                            initials.length > 0
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:-translate-y-0.5'
                                : 'bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted'
                        )}
                    >
                        {isStarting ? 'Starting...' : 'Begin practice'}
                    </Button>
                </div>

                {/* 8. Footer Microcopy */}
                <div className="text-left pt-8 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                        You can return to this session anytime using the same link.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
