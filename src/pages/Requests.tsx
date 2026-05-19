
import { RequestForm } from "@/components/RequestForm";
import { useRequests, UpdateRequest } from "@/hooks/useRequests";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRoles } from "@/hooks/useUserRoles";
import { AdminRequestActions } from "@/components/AdminRequestActions";

const RequestsPage = () => {
    const { isAdmin } = useUserRoles();
    const { requests, isLoading, error, updateRequest } = useRequests({ isAdmin });

    const getStatusVariant = (status: string): "secondary" | "default" | "destructive" | "outline" => {
        switch (status) {
            case 'pending':
            case 'will do in future':
                return 'secondary';
            case 'approved':
            case 'done':
                return 'default';
            case 'rejected':
            case 'will not be available':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Submit a Request</h1>
                <p className="text-muted-foreground">Request a new TV show or provide other feedback.</p>
            </header>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>New Request</CardTitle>
                            <CardDescription>Fill out the form to send us your request.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RequestForm />
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <h2 className="text-2xl font-bold tracking-tight mb-4">
                        {isAdmin ? 'All User Requests' : 'Your Past Requests'}
                    </h2>
                    
                    {isLoading && (
                        <div className="space-y-4">
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    )}

                    {error && <p className="text-destructive">Error loading requests: {error.message}</p>}
                    
                    {!isLoading && !error && (
                        requests && requests.length > 0 ? (
                            <div className="space-y-4">
                                {requests.map(request => (
                                    <Card key={request.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">{request.title}</CardTitle>
                                                    <CardDescription>
                                                        {request.type === 'tv_show_request' ? 'TV Show Request' : 'Other Feedback'} - Submitted on {format(new Date(request.created_at), 'PPP')}
                                                    </CardDescription>
                                                </div>
                                                {isAdmin && updateRequest ? (
                                                    <AdminRequestActions
                                                        requestId={request.id}
                                                        currentStatus={request.status}
                                                        updateRequest={updateRequest}
                                                    />
                                                ) : (
                                                    <Badge variant={getStatusVariant(request.status)} className="capitalize">{request.status}</Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        {request.message && (
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground">{request.message}</p>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="flex items-center justify-center h-32">
                                <p className="text-muted-foreground">
                                    {isAdmin ? 'No requests have been made yet.' : "You haven't made any requests yet."}
                                </p>
                            </Card>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default RequestsPage;
