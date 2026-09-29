import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MapPin,
  Mail,
  Link as LinkIcon,
  Github,
  ExternalLink,
  Pencil,
  Thermometer,
} from 'lucide-react';
import { mockCandidate } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const seniorityLevel: Record<string, number> = {
  Junior: 25,
  Pleno: 55,
  Senior: 80,
  Especialista: 100,
};

function SkillBar({ name, level }: { name: string; level: number }) {
  const colors = ['bg-jm-red', 'bg-jm-orange', 'bg-jm-orange', 'bg-jm-teal', 'bg-jm-purple'];
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-32 md:w-40 truncate">{name}</span>
      <div className="flex-1 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full transition-all',
              i < level ? colors[level - 1] : 'bg-muted'
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">Nv {level}</span>
    </div>
  );
}

export function Profile() {
  const candidate = mockCandidate;
  const initials = candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-border overflow-hidden mb-6">
          <div className="h-24 bg-gradient-purple-teal" />
          <CardContent className="p-6 -mt-12">
            <div className="flex items-start justify-between">
              <div className="flex items-end gap-4">
                <Avatar className="h-20 w-20 border-4 border-card">
                  <AvatarFallback className="bg-gradient-purple-teal text-white text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="pb-1">
                  <h1 className="text-xl font-bold">{candidate.name}</h1>
                  <p className="text-sm text-muted-foreground">{candidate.role}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {candidate.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {candidate.email}
              </span>
              <Badge className="bg-primary/10 text-primary border-0">
                {candidate.seniority}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              {candidate.bio}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Seniority thermometer */}
      <Card className="border-border mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Thermometer className="h-5 w-5 text-primary" />
            Senioridade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-8 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-jm-teal via-jm-purple to-jm-purple rounded-full flex items-center justify-end px-3"
              initial={{ width: 0 }}
              animate={{ width: `${seniorityLevel[candidate.seniority]}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <span className="text-xs font-bold text-white">{candidate.seniority}</span>
            </motion.div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Junior</span>
            <span>Pleno</span>
            <span>Senior</span>
            <span>Especialista</span>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="border-border mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Competências ({candidate.skills.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {candidate.skills.map((skill, i) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <SkillBar name={skill.name} level={skill.level} />
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card className="border-border mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Projetos ({candidate.projects.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidate.projects.map((project, i) => (
            <div
              key={i}
              className="rounded-xl border border-border p-4 hover:border-primary/20 transition-colors"
            >
              <h4 className="font-semibold">{project.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
              <a
                href="#"
                className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {project.link}
              </a>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Links */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {candidate.links.map((link) => (
              <Button key={link.label} variant="outline" size="sm" asChild>
                <a href="#" className="flex items-center gap-2">
                  {link.label === 'GitHub' ? (
                    <Github className="h-4 w-4" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                  {link.label}
                </a>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
