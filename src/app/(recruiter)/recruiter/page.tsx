import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRecruiterSessions } from "./actions";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SessionStatus } from "@/lib/domain/types";

export const dynamic = 'force-dynamic';

function getStatusBadge(status: SessionStatus) {
    switch (status) {
        case 'COMPLETED':
        case 'REVIEWING':
            return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Completed</Badge>;
        case 'IN_SESSION':
        case 'GENERATING_QUESTIONS':
        case 'AWAITING_EVALUATION':
            return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">In Progress</Badge>;
        case 'NOT_STARTED':
            return <Badge variant="outline" className="text-slate-500 border-slate-300">Pending</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}

export default async function RecruiterDashboard() {
    const sessions = await getRecruiterSessions();

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage your interview invites and review candidate results.</p>
                </div>
                <Button asChild>
                    <Link href="/recruiter/create">
                        <Plus className="w-4 h-4 mr-2" />
                        New Invite
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Invites</CardTitle>
                    <CardDescription>A list of all interview sessions created by you.</CardDescription>
                </CardHeader>
                <CardContent>
                    {sessions.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <p>No invites found. Create your first invite to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Candidate</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell className="font-medium">
                                            {session.candidateName}
                                        </TableCell>
                                        <TableCell>{session.role}</TableCell>
                                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                                        <TableCell>
                                            {new Date(session.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/recruiter/sessions/${session.id}`}>
                                                    View Details
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
