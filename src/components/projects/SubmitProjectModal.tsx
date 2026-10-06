import React, { useState } from 'react';
import { Modal } from '../../design-system/primitives/Modal';
import { Input } from '../../design-system/primitives/Input';
import { Button } from '../../design-system/primitives/Button';
import { Dropdown } from '../../design-system/primitives/Dropdown';
import { useToast } from '../../design-system/primitives/Toast';

export interface SubmitProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

export const SubmitProjectModal: React.FC<SubmitProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'DeFi' | 'Infrastructure' | 'Tooling' | 'Gaming' | 'Community'>('DeFi');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Project name is required';
    if (!description.trim()) newErrors.description = 'Brief summary is required';
    if (!website.trim()) newErrors.website = 'Website URL is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    // Simulate clean submission
    await new Promise((r) => setTimeout(r, 600));

    setIsSubmitting(false);
    showToast({
      type: 'success',
      title: 'Submission Received',
      message: 'Your project has been queued for Elysium registry review.',
    });

    onClose();
    onSubmitSuccess?.();
    setName('');
    setDescription('');
    setWebsite('');
    setContractAddress('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Project to Elysium Registry"
      description="List your Elysium-native protocol, tooling, or application on LAKNES."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name *"
          placeholder="e.g. VulcanSwap"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <div className="text-left space-y-1.5">
          <label className="block text-xs font-medium text-neutral-800">
            Category *
          </label>
          <Dropdown
            value={category}
            onChange={(val) => setCategory(val as typeof category)}
            options={[
              { value: 'DeFi', label: 'DeFi (Decentralized Finance)' },
              { value: 'Infrastructure', label: 'Infrastructure & Nodes' },
              { value: 'Tooling', label: 'Developer Tooling' },
              { value: 'Gaming', label: 'Gaming & Metaverse' },
              { value: 'Community', label: 'Community & Governance' },
            ]}
          />
        </div>

        <Input
          label="Official Website URL *"
          placeholder="https://yourproject.io"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          error={errors.website}
        />

        <Input
          label="Contract / Token Address (Optional)"
          placeholder="0x…"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          helperText="Elysium contract or factory address if deployed"
        />

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-medium text-neutral-800">
            Project Summary *
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A concise, factual description of what your project provides on Elysium…"
            className="w-full rounded-md bg-white border border-neutral-200 p-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
          />
          {errors.description && (
            <p className="text-xs text-red-600">{errors.description}</p>
          )}
        </div>

        <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Submit for Review
          </Button>
        </div>
      </form>
    </Modal>
  );
};
