import { Progress } from "@/components/ui/progress";
import { getPasswordStrength } from "@/lib/auth-schemas";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { score, label, color } = getPasswordStrength(password);
  const percentage = (score / 5) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">パスワード強度:</span>
        <span className={`text-sm font-medium ${color}`}>{label}</span>
      </div>
      <Progress value={percentage} className="h-2" />
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${password.length >= 8 ? "bg-green-500" : "bg-gray-300"}`}
          />
          <span>8文字以上</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${/[a-z]/.test(password) ? "bg-green-500" : "bg-gray-300"}`}
          />
          <span>小文字を含む</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${/[A-Z]/.test(password) ? "bg-green-500" : "bg-gray-300"}`}
          />
          <span>大文字を含む</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${/\d/.test(password) ? "bg-green-500" : "bg-gray-300"}`}
          />
          <span>数字を含む</span>
        </div>
      </div>
    </div>
  );
}
