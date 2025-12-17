import { useState } from 'react';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Search, 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Clock, 
  Building2,
  Send,
  Check,
  X,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  useAgentSearch,
  useMyPartnerships,
  useSendPartnerRequest,
  useRespondToPartnership,
  useRemovePartnership,
} from '@/hooks/useAgentNetwork';

export default function AgentNetwork() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: searchResults = [], isLoading: searchLoading } = useAgentSearch(searchTerm);
  const { data: partnerships, isLoading: partnershipsLoading } = useMyPartnerships();
  const sendRequest = useSendPartnerRequest();
  const respondToPartnership = useRespondToPartnership();
  const removePartnership = useRemovePartnership();

  const acceptedPartners = [
    ...(partnerships?.sent.filter(p => p.status === 'accepted') || []),
    ...(partnerships?.received.filter(p => p.status === 'accepted') || []),
  ];

  const pendingReceived = partnerships?.received.filter(p => p.status === 'pending') || [];
  const pendingSent = partnerships?.sent.filter(p => p.status === 'pending') || [];

  // Check if agent is already a partner or has pending request
  const getAgentStatus = (agentId: string) => {
    const sentPartnership = partnerships?.sent.find(p => p.receiver_id === agentId);
    const receivedPartnership = partnerships?.received.find(p => p.requester_id === agentId);
    
    if (sentPartnership?.status === 'accepted' || receivedPartnership?.status === 'accepted') {
      return 'partner';
    }
    if (sentPartnership?.status === 'pending') {
      return 'pending_sent';
    }
    if (receivedPartnership?.status === 'pending') {
      return 'pending_received';
    }
    return 'none';
  };

  const handleSendRequest = async (agentId: string) => {
    try {
      await sendRequest.mutateAsync(agentId);
      toast.success('Partnership request sent!');
      setSearchTerm('');
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error('Partnership request already exists');
      } else {
        toast.error('Failed to send request');
      }
    }
  };

  const handleAccept = async (partnershipId: string) => {
    try {
      await respondToPartnership.mutateAsync({ partnershipId, status: 'accepted' });
      toast.success('Partnership accepted!');
    } catch (error) {
      toast.error('Failed to accept partnership');
    }
  };

  const handleReject = async (partnershipId: string) => {
    try {
      await respondToPartnership.mutateAsync({ partnershipId, status: 'rejected' });
      toast.info('Partnership request declined');
    } catch (error) {
      toast.error('Failed to decline partnership');
    }
  };

  const handleRemove = async (partnershipId: string) => {
    try {
      await removePartnership.mutateAsync(partnershipId);
      toast.info('Partnership removed');
    } catch (error) {
      toast.error('Failed to remove partnership');
    }
  };

  const getAgentName = (agent: { agency_name: string | null; theme_agency_name: string | null }) => {
    return agent.theme_agency_name || agent.agency_name || 'Unknown Agency';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <AgentLayout>
      <div className="container px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            Partner Network
          </h1>
          <p className="text-muted-foreground font-body">
            Connect with other agents to share listings and collaborate
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5 text-accent" />
              Find Agents
            </CardTitle>
            <CardDescription>
              Search for agents by agency name to send partnership requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by agency name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchTerm.length >= 2 && (
              <div className="mt-4 space-y-2">
                {searchLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No agents found</p>
                ) : (
                  searchResults.map((agent) => {
                    const status = getAgentStatus(agent.id);
                    return (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={agent.profile_image || ''} />
                            <AvatarFallback className="bg-accent/20 text-accent text-sm">
                              {getInitials(getAgentName(agent))}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{getAgentName(agent)}</p>
                          </div>
                        </div>
                        {status === 'partner' ? (
                          <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Partner
                          </Badge>
                        ) : status === 'pending_sent' ? (
                          <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        ) : status === 'pending_received' ? (
                          <Badge variant="secondary" className="bg-info/20 text-info border-info/30">
                            <Clock className="w-3 h-3 mr-1" />
                            Respond
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSendRequest(agent.id)}
                            disabled={sendRequest.isPending}
                          >
                            {sendRequest.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-1" />
                                Request
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Partnerships Tabs */}
        <Tabs defaultValue="partners" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="partners" className="gap-2">
              <Users className="w-4 h-4" />
              Partners
              {acceptedPartners.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {acceptedPartners.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="incoming" className="gap-2">
              <UserPlus className="w-4 h-4" />
              Incoming
              {pendingReceived.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5 bg-accent">
                  {pendingReceived.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="gap-2">
              <Send className="w-4 h-4" />
              Outgoing
              {pendingSent.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {pendingSent.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* My Partners */}
          <TabsContent value="partners">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-success" />
                  My Partners
                </CardTitle>
                <CardDescription>
                  Agents you're partnered with for listing sharing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partnershipsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : acceptedPartners.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No partners yet</p>
                    <p className="text-sm">Search for agents above to start building your network</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {acceptedPartners.map((partnership) => (
                      <div
                        key={partnership.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-success/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={partnership.partner?.profile_image || ''} />
                            <AvatarFallback className="bg-success/20 text-success">
                              {partnership.partner ? getInitials(getAgentName(partnership.partner)) : '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {partnership.partner ? getAgentName(partnership.partner) : 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              Partner since {new Date(partnership.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(partnership.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Incoming Requests */}
          <TabsContent value="incoming">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-accent" />
                  Incoming Requests
                </CardTitle>
                <CardDescription>
                  Partnership requests from other agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partnershipsLoading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : pendingReceived.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No pending requests</p>
                    <p className="text-sm">When other agents send you requests, they'll appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingReceived.map((partnership) => (
                      <div
                        key={partnership.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-accent/20"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={partnership.partner?.profile_image || ''} />
                            <AvatarFallback className="bg-accent/20 text-accent">
                              {partnership.partner ? getInitials(getAgentName(partnership.partner)) : '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {partnership.partner ? getAgentName(partnership.partner) : 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Requested {new Date(partnership.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAccept(partnership.id)}
                            disabled={respondToPartnership.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(partnership.id)}
                            disabled={respondToPartnership.isPending}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outgoing Requests */}
          <TabsContent value="outgoing">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-info" />
                  Outgoing Requests
                </CardTitle>
                <CardDescription>
                  Partnership requests you've sent to other agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partnershipsLoading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : pendingSent.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No outgoing requests</p>
                    <p className="text-sm">Search for agents above to send partnership requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingSent.map((partnership) => (
                      <div
                        key={partnership.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={partnership.partner?.profile_image || ''} />
                            <AvatarFallback className="bg-warning/20 text-warning">
                              {partnership.partner ? getInitials(getAgentName(partnership.partner)) : '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {partnership.partner ? getAgentName(partnership.partner) : 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Sent {new Date(partnership.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
                          Pending
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AgentLayout>
  );
}
