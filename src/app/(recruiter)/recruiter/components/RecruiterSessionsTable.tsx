"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, Copy, Trash2, CheckCircle2 } from "lucide-react";
import { SessionSummary } from "@/lib/domain/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteSession } from "../actions";

interface RecruiterSessionsTableProps {
    initialSessions: SessionSummary[];
    recruiterTimezone?: string;
}

type SortConfig = {
    key: keyof SessionSummary | 'created';
    direction: 'asc' | 'desc';
} | null;

function getStatusBadge(session: SessionSummary) {
    const { status, answerCount, questionCount, submittedCount, viewedAt, enteredInitials } = session;

    const commonClasses = "w-[145px] justify-center text-center";

    // 1. Completed
    if (status === 'COMPLETED' || (submittedCount === questionCount && questionCount > 0)) {
        return <Badge variant="default" className={`${commonClasses} bg-green-600 hover:bg-green-700`}>Completed</Badge>;
    }

    // 2. In Progress (X/Y submitted)
    if (submittedCount > 0) {
        return <Badge variant="secondary" className={`${commonClasses} bg-blue-100 text-blue-800 hover:bg-blue-200`}>
            In Progress ({submittedCount}/{questionCount})
        </Badge>;
    }

    // 3. Drafting Answer (entered session and started typing/recording but not submitted)
    if (status === 'IN_SESSION' && answerCount > 0) {
        return <Badge variant="secondary" className={`${commonClasses} bg-indigo-100 text-indigo-800 border-indigo-200`}>
            Drafting Answer
        </Badge>;
    }

    // 4. Session Started (clicked start button, no progress yet)
    if (status === 'IN_SESSION') {
        return <Badge variant="secondary" className={`${commonClasses} bg-blue-50 text-blue-700 border-blue-100`}>
            Session Started
        </Badge>;
    }

    // 5. Initials Entered (pre-flight gate passed)
    if (enteredInitials) {
        return <Badge variant="outline" className={`${commonClasses} text-amber-600 border-amber-200 bg-amber-50`}>
            Initials Entered
        </Badge>;
    }

    // 6. Link Viewed (first engagement)
    if (viewedAt) {
        return <Badge variant="outline" className={`${commonClasses} text-indigo-500 border-indigo-200`}>
            Link Viewed
        </Badge>;
    }

    // 7. Never Viewed (initial state)
    return <Badge variant="outline" className={`${commonClasses} text-slate-400 border-slate-200 uppercase text-[10px]`}>
        Invite Sent
    </Badge>;
}

export function RecruiterSessionsTable({ initialSessions, recruiterTimezone }: RecruiterSessionsTableProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleSort = (key: keyof SessionSummary | 'created') => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'desc' };
        });
    };

    const handleCopyLink = async (token: string, sessionId: string) => {
        const link = `${window.location.origin}/s/${token}`;
        await navigator.clipboard.writeText(link);
        setCopiedId(sessionId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Re-fetch data whenever the tab regains focus (covers back-navigation, tab switching, etc.)
    useEffect(() => {
        const onFocus = () => router.refresh();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [router]);

    const handleDelete = async (sessionId: string) => {
        if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
            return;
        }

        setIsDeleting(sessionId);
        try {
            await deleteSession(sessionId);
            router.refresh();
        } catch {
            alert("Failed to delete session.");
        } finally {
            setIsDeleting(null);
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        try {
            const timeStr = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: recruiterTimezone || undefined
            });

            const tzName = new Intl.DateTimeFormat('en-US', {
                timeZoneName: 'short',
                timeZone: recruiterTimezone || undefined
            }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value || "";

            return `${date.toLocaleDateString()} ${timeStr} ${tzName}`;
        } catch {
            return date.toLocaleString();
        }
    };

    const filteredAndSortedSessions = useMemo(() => {
        let result = [...initialSessions];

        // Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.candidateName.toLowerCase().includes(query) ||
                s.role.toLowerCase().includes(query)
            );
        }

        // Sort
        if (sortConfig) {
            result.sort((a, b) => {
                let aVal: string | number;
                let bVal: string | number;

                if (sortConfig.key === 'created') {
                    aVal = a.createdAt;
                    bVal = b.createdAt;
                } else {
                    const key = sortConfig.key as keyof SessionSummary;
                    aVal = a[key] as string | number;
                    bVal = b[key] as string | number;
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [initialSessions, searchQuery, sortConfig]);

    return (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Search candidates or roles..."
                    className="pl-9 bg-slate-50 border-slate-200"
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[200px]">
                                <button
                                    onClick={() => handleSort('candidateName')}
                                    className="flex items-center gap-1 hover:text-slate-900 transition-colors uppercase text-[11px] font-bold tracking-wider text-slate-500"
                                >
                                    Candidate <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </TableHead>
                            <TableHead>
                                <button
                                    onClick={() => handleSort('role')}
                                    className="flex items-center gap-1 hover:text-slate-900 transition-colors uppercase text-[11px] font-bold tracking-wider text-slate-500"
                                >
                                    Role <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </TableHead>
                            <TableHead>
                                <button
                                    onClick={() => handleSort('status')}
                                    className="flex items-center gap-1 hover:text-slate-900 transition-colors uppercase text-[11px] font-bold tracking-wider text-slate-500"
                                >
                                    Status <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </TableHead>
                            <TableHead>
                                <button
                                    onClick={() => handleSort('created')}
                                    className="flex items-center gap-1 hover:text-slate-900 transition-colors uppercase text-[11px] font-bold tracking-wider text-slate-500"
                                >
                                    Created <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </TableHead>
                            <TableHead className="text-right uppercase text-[11px] font-bold tracking-wider text-slate-500 px-6">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedSessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-slate-400 italic">
                                    No sessions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedSessions.map((session) => (
                                <TableRow
                                    key={session.id}
                                    className="group cursor-pointer hover:bg-blue-50/40 transition-colors border-b border-slate-100 last:border-0"
                                    onClick={() => router.push(`/recruiter/sessions/${session.id}`)}
                                >
                                    <TableCell className="font-semibold text-slate-900 py-4">
                                        {session.candidateName}
                                    </TableCell>
                                    <TableCell className="text-slate-600">{session.role}</TableCell>
                                    <TableCell>{getStatusBadge(session)}</TableCell>
                                    <TableCell className="text-slate-500 whitespace-nowrap text-sm">
                                        {formatTimestamp(session.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right px-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                                className="text-primary hover:text-primary hover:bg-primary/5 transition-colors font-medium h-8"
                                            >
                                                <Link href={`/recruiter/sessions/${session.id}`}>
                                                    View Results
                                                </Link>
                                            </Button>

                                            {session.inviteToken && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                    title="Copy Invite Link"
                                                    onClick={() => handleCopyLink(session.inviteToken!, session.id)}
                                                >
                                                    {copiedId === session.id ? (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 animate-in zoom-in-50" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Delete Session"
                                                disabled={isDeleting === session.id}
                                                onClick={() => handleDelete(session.id)}
                                            >
                                                <Trash2 className={isDeleting === session.id ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <p className="text-[11px] text-slate-400 px-1">
                Tip: Invite links are securely encrypted at rest to maintain SOC 2 compliance.
            </p>
        </div>
    );
}
