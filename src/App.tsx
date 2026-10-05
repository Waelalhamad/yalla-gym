import { Route, Switch } from "wouter";
import { StoreProvider } from "@/lib/storage";
import { ToastProvider } from "@/hooks/use-toast";
import { BreakTimerProvider } from "@/hooks/use-break-timer";
import AppLayout from "@/components/layout/AppLayout";
import Home from "@/pages/Home";
import Day from "@/pages/Day";
import Workout from "@/pages/Workout";
import Library from "@/pages/Library";
import Nutrition from "@/pages/Nutrition";
import Progress from "@/pages/Progress";
import ProfilePage from "@/pages/Profile";

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <BreakTimerProvider>
          <AppLayout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/day" component={Day} />
              <Route path="/workout" component={Workout} />
              <Route path="/library" component={Library} />
              <Route path="/nutrition" component={Nutrition} />
              <Route path="/progress" component={Progress} />
              <Route path="/profile" component={ProfilePage} />
              <Route component={Home} />
            </Switch>
          </AppLayout>
        </BreakTimerProvider>
      </ToastProvider>
    </StoreProvider>
  );
}
