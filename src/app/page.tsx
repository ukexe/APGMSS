'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { analyzeGrievance } from '../lib/ai-processing';
import { processFile } from '../lib/ocr-processing';
import { storeGrievanceRecord } from '../lib/blockchain';
import type { Database } from '../types/supabase';
import type { CategoryResponse } from '../types/api';

type Language = Database['public']['Enums']['grievance_language'];
type Status = Database['public']['Enums']['grievance_status'];
type Priority = Database['public']['Enums']['grievance_priority'];

export default function Home() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'English' as Language,
    category_id: 0,
    isAnonymous: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [similarGrievances, setSimilarGrievances] = useState<any[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) {
        setCategories(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, category_id: data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processUploadedFile = async (file: File) => {
    setIsProcessingFile(true);
    setFileError(null);

    try {
      const result = await processFile(file);
      
      if (result.error) {
        setFileError(result.error);
      } else if (result.text) {
        setFormData(prev => ({
          ...prev,
          description: prev.description 
            ? `${prev.description}\n\nExtracted text from ${file.name}:\n${result.text}`
            : result.text
        }));
      }
    } catch (error) {
      setFileError('Failed to process file. Please try again.');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSimilarGrievances([]);

    try {
      // Perform AI analysis
      const analysis = await analyzeGrievance(
        formData.title,
        formData.description,
        formData.language
      );

      // Find category ID based on AI-suggested category
      const suggestedCategory = categories.find(c => c.name === analysis.category);
      const finalCategoryId = suggestedCategory ? suggestedCategory.id : formData.category_id;

      // Set similar grievances if found
      if (analysis.similarGrievances.length > 0) {
        setSimilarGrievances(analysis.similarGrievances);
      }

      // Submit grievance with AI-enhanced data
      const { data, error } = await supabase
        .from('grievances')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            language: formData.language,
            category_id: finalCategoryId,
            status: 'Pending' as Status,
            priority: analysis.priority,
            user_id: formData.isAnonymous ? null : undefined,
          },
        ])
        .select();

      if (error) throw error;
      
      if (data && data[0]) {
        // Store the grievance record in blockchain
        try {
          const blockchainRecord = await storeGrievanceRecord({
            ...data[0],
            analysis,
            metadata: {
              submissionTime: new Date().toISOString(),
              isAnonymous: formData.isAnonymous,
              aiProcessed: true,
            },
          });
          console.log('Blockchain record created:', blockchainRecord);
        } catch (blockchainError) {
          console.error('Blockchain storage failed:', blockchainError);
          // Continue with submission even if blockchain storage fails
        }
      }

      alert('Grievance submitted successfully!');
      setFormData({
        title: '',
        description: '',
        language: 'English',
        category_id: categories[0]?.id || 0,
        isAnonymous: false,
      });
    } catch (error) {
      console.error('Error submitting grievance:', error);
      alert('Failed to submit grievance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Submit a Grievance</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              required
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload Document (Optional)
            </label>
            <div
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
            >
              <div className="space-y-1 text-center">
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      ref={fileInputRef}
                      className="sr-only"
                      accept=".pdf,image/*"
                      onChange={handleFileChange}
                      disabled={isProcessingFile}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF or image up to 5MB
                </p>
                {isProcessingFile && (
                  <div className="mt-2 text-sm text-gray-500">
                    Processing file...
                  </div>
                )}
                {fileError && (
                  <div className="mt-2 text-sm text-red-600">
                    {fileError}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700">
              Language
            </label>
            <select
              id="language"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value as Language })}
            >
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
            />
            <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
              Submit Anonymously
            </label>
          </div>

          {similarGrievances.length > 0 && (
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Similar grievances found
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      We found similar grievances in our system. This might be a recurring issue.
                      Would you still like to proceed with your submission?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isProcessingFile}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isSubmitting || isProcessingFile
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {isSubmitting ? 'Processing...' : 'Submit Grievance'}
          </button>
        </form>
      </div>
    </div>
  );
} 
