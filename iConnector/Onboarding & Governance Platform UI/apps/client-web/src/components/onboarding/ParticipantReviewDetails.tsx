import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircle, Building2, Check, Globe, Mail, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { IntendedParticipationRole, ParticipantProfile } from "@dataspace-onboarding/shared";

interface ParticipantReviewDetailsProps {
  value: ParticipantProfile;
  onChange: (value: ParticipantProfile) => void;
  onValidityChange?: (isValid: boolean) => void;
}

const roleOptions: Array<{ value: IntendedParticipationRole; label: string; description: string }> = [
  {
    value: "provider",
    label: "Provider",
    description: "Shares datasets, services, or data products with other participants.",
  },
  {
    value: "consumer",
    label: "Consumer",
    description: "Consumes datasets or services from other participants.",
  },
  {
    value: "prosumer",
    label: "Prosumer",
    description: "Both provides and consumes data services in the ecosystem.",
  },
];

const participantDetailsSchema = z.object({
  organizationName: z.string().trim().min(1, "Organization name is required"),
  intendedParticipation: z.enum(["provider", "consumer", "prosumer"]),
  businessPurpose: z.string().trim().min(1, "Description is required"),
  contactEmail: z
    .union([z.literal(""), z.string().email("Enter a valid email address")])
    .optional()
    .transform((value) => value ?? ""),
  website: z
    .union([z.literal(""), z.string().url("Enter a valid URL (https://...)")])
    .optional()
    .transform((value) => value ?? ""),
  country: z.string().optional(),
  additionalInformation: z.string().optional(),
});

type ParticipantDetailsFormValues = z.infer<typeof participantDetailsSchema>;

export function ParticipantReviewDetails({ value, onChange, onValidityChange }: ParticipantReviewDetailsProps) {
  const {
    register,
    watch,
    formState: { errors, touchedFields },
  } = useForm<ParticipantDetailsFormValues>({
    mode: "onChange",
    defaultValues: {
      organizationName: value.organizationName,
      intendedParticipation: value.intendedParticipation ?? undefined,
      businessPurpose: value.businessPurpose,
      contactEmail: value.contactEmail || "",
      website: value.website || "",
      country: value.country || "",
      additionalInformation: value.additionalInformation || "",
    },
  });

  const formValues = watch();

  useEffect(() => {
    const parsed = participantDetailsSchema.safeParse(formValues);
    onValidityChange?.(parsed.success);
    const nextValue: ParticipantProfile = {
      organizationName: formValues.organizationName || "",
      intendedParticipation: (formValues.intendedParticipation as IntendedParticipationRole | undefined) ?? null,
      businessPurpose: formValues.businessPurpose || "",
      contactEmail: formValues.contactEmail || "",
      website: formValues.website || "",
      country: formValues.country || "",
      additionalInformation: formValues.additionalInformation || "",
    };

    const changed =
      nextValue.organizationName !== value.organizationName ||
      nextValue.intendedParticipation !== value.intendedParticipation ||
      nextValue.businessPurpose !== value.businessPurpose ||
      nextValue.contactEmail !== (value.contactEmail || "") ||
      nextValue.website !== (value.website || "") ||
      nextValue.country !== (value.country || "") ||
      nextValue.additionalInformation !== (value.additionalInformation || "");

    if (changed) {
      onChange(nextValue);
    }
  }, [formValues, onChange, onValidityChange, value]);

  const requirements = [
    { met: (formValues.organizationName || "").trim().length > 0, label: "Organization name required" },
    { met: !!formValues.intendedParticipation, label: "Choose Provider/Consumer/Prosumer" },
    { met: (formValues.businessPurpose || "").trim().length > 0, label: "Description required" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold">Organisation Details</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Provide organization profile details so the trusted issuer can validate your admission request and VC issuance
          eligibility.
        </p>
      </div>

      <Card className="space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="organizationName">
            <Building2 className="size-4" />
            Organization Name
          </Label>
          <Input
            id="organizationName"
            placeholder="Enter your legal organization name"
            aria-invalid={!!errors.organizationName && touchedFields.organizationName}
            {...register("organizationName", { required: "Organization name is required" })}
          />
          {errors.organizationName && touchedFields.organizationName && (
            <p className="text-xs text-destructive">{errors.organizationName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            <Users className="size-4" />
            Intended Participation Role
          </Label>
          <div className="space-y-2">
            {roleOptions.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-start gap-3 rounded border bg-card p-3">
                <input
                  type="radio"
                  value={option.value}
                  checked={formValues.intendedParticipation === option.value}
                  {...register("intendedParticipation", { required: "Please select one participation role" })}
                  className="mt-0.5 size-4"
                />
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
          {errors.intendedParticipation && (
            <p className="text-xs text-destructive">{errors.intendedParticipation.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessPurpose">Intended Use in DataSpace</Label>
          <Textarea
            id="businessPurpose"
            rows={4}
            placeholder="Describe intended datasets/services exchange, use cases, and why you need admission."
            aria-invalid={!!errors.businessPurpose && touchedFields.businessPurpose}
            {...register("businessPurpose", { required: "Description is required" })}
          />
          {errors.businessPurpose && touchedFields.businessPurpose && (
            <p className="text-xs text-destructive">{errors.businessPurpose.message}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {requirements.map((req) => (
            <span
              key={req.label}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${
                req.met ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              }`}
            >
              {req.met ? <Check className="size-3" /> : <AlertCircle className="size-3" />}
              {req.label}
            </span>
          ))}
        </div>
      </Card>

      <Card className="grid gap-4 p-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactEmail">
            <Mail className="size-4" />
            Contact Email (optional)
          </Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="compliance@organization.com"
            aria-invalid={!!errors.contactEmail && touchedFields.contactEmail}
            {...register("contactEmail", {
              validate: (value) => {
                if (!value?.trim()) return true;
                const result = z.string().email("Enter a valid email address").safeParse(value.trim());
                return result.success || result.error.issues[0]?.message || "Enter a valid email address";
              },
            })}
          />
          {errors.contactEmail && touchedFields.contactEmail && (
            <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">
            <Globe className="size-4" />
            Organization Website (optional)
          </Label>
          <Input
            id="website"
            placeholder="https://organization.example"
            aria-invalid={!!errors.website && touchedFields.website}
            {...register("website", {
              validate: (value) => {
                if (!value?.trim()) return true;
                const result = z.string().url("Enter a valid URL (https://...)").safeParse(value.trim());
                return result.success || result.error.issues[0]?.message || "Enter a valid URL (https://...)";
              },
            })}
          />
          {errors.website && touchedFields.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="country">
            <MapPin className="size-4" />
            Country / Jurisdiction (optional)
          </Label>
          <Input
            id="country"
            placeholder="Enter country or jurisdiction"
            {...register("country")}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="additionalInformation">Additional Information (optional)</Label>
          <Textarea
            id="additionalInformation"
            rows={3}
            placeholder="Any certificates, memberships, or context that helps issuer validation."
            {...register("additionalInformation")}
          />
        </div>
      </Card>
    </div>
  );
}
