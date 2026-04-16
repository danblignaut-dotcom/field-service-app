import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HardHat, LayoutDashboard, Target, Briefcase } from 'lucide-react';

export default function Home() {
  const { user, login } = useAppContext();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      if (user.role === 'manager') setLocation('/manager');
      else if (user.role === 'sales') setLocation('/sales');
      else if (user.role === 'field_staff') setLocation('/field');
    }
  }, [user, setLocation]);

  if (user) return null;

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg">
              <HardHat className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-foreground">FSM.IO</h1>
          <p className="text-muted-foreground text-lg">Field Service Command Center</p>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Select Demo Role</CardTitle>
            <CardDescription className="text-center">
              Log in to explore different experiences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full h-16 justify-start text-lg group hover:border-primary hover:text-primary transition-all"
              onClick={() => login('manager')}
            >
              <LayoutDashboard className="mr-4 h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Manager</span>
                <span className="text-xs text-muted-foreground font-normal">Full access to all operations</span>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full h-16 justify-start text-lg group hover:border-primary hover:text-primary transition-all"
              onClick={() => login('sales')}
            >
              <Target className="mr-4 h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Sales Rep</span>
                <span className="text-xs text-muted-foreground font-normal">Leads and quote generation</span>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full h-16 justify-start text-lg group hover:border-primary hover:text-primary transition-all"
              onClick={() => login('field_staff')}
            >
              <Briefcase className="mr-4 h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Field Staff</span>
                <span className="text-xs text-muted-foreground font-normal">Job execution and completion</span>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
