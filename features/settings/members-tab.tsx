"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, Mail, Trash2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { formatDate, getInitials } from "@/lib/utils"

interface Member {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "member"
  joinedAt: string
  lastActiveAt: string
}

const mockMembers: Member[] = [
  {
    id: "user_1",
    name: "John Smith",
    email: "john@acme.com",
    role: "owner",
    joinedAt: "2023-06-01T00:00:00Z",
    lastActiveAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "user_2",
    name: "Sarah Johnson",
    email: "sarah@acme.com",
    role: "admin",
    joinedAt: "2023-08-15T00:00:00Z",
    lastActiveAt: "2024-01-20T10:00:00Z",
  },
  {
    id: "user_3",
    name: "Mike Wilson",
    email: "mike@acme.com",
    role: "member",
    joinedAt: "2024-01-10T00:00:00Z",
    lastActiveAt: "2024-01-19T16:45:00Z",
  },
]

const roleColors: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
}

export function MembersTab() {
  const { toast } = useToast()
  const [members, setMembers] = useState<Member[]>(mockMembers)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member")

  const handleInvite = () => {
    toast({
      title: "Invitation sent",
      description: `An invitation has been sent to ${inviteEmail}`,
    })
    setInviteEmail("")
    setInviteRole("member")
    setIsInviteOpen(false)
  }

  const handleRemoveMember = (member: Member) => {
    setMembers(members.filter((m) => m.id !== member.id))
    toast({
      title: "Member removed",
      description: `${member.name} has been removed from the organization.`,
    })
  }

  const handleChangeRole = (memberId: string, newRole: "admin" | "member") => {
    setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)))
    toast({
      title: "Role updated",
      description: "Member role has been updated successfully.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage who has access to your organization</CardDescription>
          </div>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>Send an invitation to join your organization</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Admins can manage settings and members. Members can view and analyze calls.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={!inviteEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={roleColors[member.role]} className="capitalize">
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(member.joinedAt)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(member.lastActiveAt)}</TableCell>
                <TableCell>
                  {member.role !== "owner" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(member.id, member.role === "admin" ? "member" : "admin")}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          {member.role === "admin" ? "Make Member" : "Make Admin"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveMember(member)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
