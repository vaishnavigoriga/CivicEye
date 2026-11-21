import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Eye, EyeOff, Lock, Mail, Shield, User, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Collapsible demo credentials drawer for evaluators
  const [showEvaluatorDrawer, setShowEvaluatorDrawer] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      showToast('Authenticated successfully.', 'success');
      // If logging in as admin email, direct to admin
      if (email.includes('admin')) {
        navigate('/admin');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header Title */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded bg-civic-900 border border-civic-950 flex items-center justify-center text-white font-extrabold text-sm mx-auto shadow-xs">
            CE
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to CivicEye</h1>
          <p className="text-xs text-slate-500">
            Greater Hyderabad Municipal Region Infrastructure Portal
          </p>
        </div>

        {/* Login Form Card */}
        <Card elevated>
          <form onSubmit={handleSubmit}>
            <CardBody className="p-6 space-y-4">
              {errorMessage && (
                <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
                  {errorMessage}
                </Alert>
              )}

              {/* Email */}
              <Input
                label="Registered Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                leftAddon={<Mail className="w-4 h-4" />}
              />

              {/* Password */}
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter account password"
                autoComplete="current-password"
                leftAddon={<Lock className="w-4 h-4" />}
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                className="w-full mt-2 font-semibold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </CardBody>
          </form>

          <CardFooter className="px-6 py-3.5 bg-slate-50 text-center text-xs text-slate-600 border-t border-slate-100 flex items-center justify-between">
            <span>New citizen?</span>
            <Link to="/register" className="font-bold text-civic-700 hover:text-civic-900 hover:underline">
              Create an account
            </Link>
          </CardFooter>
        </Card>

        {/* Optional Evaluator / Demo Credentials Section (Separated & Collapsible) */}
        <div className="border border-slate-200 rounded-md bg-white p-3.5 shadow-xs text-xs space-y-2">
          <button
            type="button"
            onClick={() => setShowEvaluatorDrawer(!showEvaluatorDrawer)}
            className="w-full flex items-center justify-between text-slate-600 hover:text-slate-900 font-semibold"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-civic-700" />
              <span>Hackathon Evaluator & Demo Access</span>
            </div>
            {showEvaluatorDrawer ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showEvaluatorDrawer && (
            <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
              <p>
                Clicking either credential option below populates the sign-in form for testing without bypassing authentic validation:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fillCredentials('citizen@civiceye.demo', 'demo1234')}
                  className="p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <User className="w-3 h-3 text-civic-700" />
                    <span>Demo Citizen</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">citizen@civiceye.demo</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('admin@civiceye.demo', 'admin1234')}
                  className="p-2 rounded border border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 text-left transition-colors"
                >
                  <div className="font-bold text-purple-900 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-purple-700" />
                    <span>Demo Administrator</span>
                  </div>
                  <div className="text-[10px] text-purple-700 font-mono truncate">admin@civiceye.demo</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
